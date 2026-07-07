using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using MangaStudio.Backend.Data;
using MangaStudio.Backend.Models.DTOs;
using MangaStudio.Backend.Models.Entities;
using MangaStudio.Backend.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

namespace MangaStudio.Backend.Services.Implementations;

/// <summary>
/// Triển khai các nghiệp vụ quản lý chương truyện.
/// </summary>
public class ChapterService : IChapterService
{
    private readonly AppDbContext _context;
    private readonly IStorageService _storageService;
    private static readonly SemaphoreSlim _uploadLock = new SemaphoreSlim(1, 1);

    public ChapterService(AppDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    /// <summary>
    /// Tạo chương mới trong một bộ truyện.
    /// Business Rule: ChapterNumber phải là duy nhất trong Series.
    /// </summary>
    public async Task<ChapterDto> CreateChapter(Guid seriesId, Guid mangakaId, CreateChapterDto dto)
    {
        var series = await _context.Series.FindAsync(seriesId)
            ?? throw new KeyNotFoundException($"Bộ truyện với ID {seriesId} không tồn tại.");

        if (series.MangakaId != mangakaId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền thêm chương vào bộ truyện này.");
        }

        var chapterExists = await _context.Chapters
            .AnyAsync(c => c.SeriesId == seriesId && c.ChapterNumber == dto.ChapterNumber);

        if (chapterExists)
        {
            throw new ArgumentException($"Số chương {dto.ChapterNumber} đã tồn tại trong bộ truyện này.");
        }

        var chapter = new Chapter
        {
            ChapterId = Guid.NewGuid(),
            SeriesId = seriesId,
            ChapterNumber = dto.ChapterNumber,
            Title = dto.Title ?? string.Empty,
            Status = "draft",
            DueDate = dto.DueDate.HasValue ? DateOnly.FromDateTime(dto.DueDate.Value) : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Chapters.Add(chapter);
        await _context.SaveChangesAsync();

        return await GetChapterById(chapter.ChapterId);
    }

    /// <summary>
    /// Lấy thông tin chi tiết một chương truyện.
    /// </summary>
    public async Task<ChapterDto> GetChapterById(Guid chapterId)
    {
        var chapter = await _context.Chapters
            .Include(c => c.Series)
                .ThenInclude(s => s.Tantou)
                    .ThenInclude(t => t!.Role)
            .Include(c => c.TantouReviewedBy)
            .Include(c => c.MangaPages)
            .FirstOrDefaultAsync(c => c.ChapterId == chapterId)
            ?? throw new KeyNotFoundException($"Chương truyện với ID {chapterId} không tồn tại.");

        return MapToDto(chapter);
    }

    /// <summary>
    /// Cập nhật thông tin chương truyện.
    /// </summary>
    public async Task<ChapterDto> UpdateChapter(Guid chapterId, Guid mangakaId, UpdateChapterDto dto)
    {
        var chapter = await _context.Chapters
            .Include(c => c.Series)
            .FirstOrDefaultAsync(c => c.ChapterId == chapterId)
            ?? throw new KeyNotFoundException($"Chương truyện với ID {chapterId} không tồn tại.");

        if (chapter.Series.MangakaId != mangakaId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền sửa chương này.");
        }

        if (dto.Title != null) chapter.Title = dto.Title;
        if (dto.DueDate != null) chapter.DueDate = DateOnly.FromDateTime(dto.DueDate.Value);
        if (dto.Status != null) chapter.Status = dto.Status;

        chapter.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetChapterById(chapter.ChapterId);
    }

    /// <summary>
    /// Lấy danh sách trang của chương.
    /// </summary>
    public async Task<List<PageDto>> GetPagesByChapter(Guid chapterId)
    {
        var pages = await _context.MangaPages
            .Where(p => p.ChapterId == chapterId)
            .Include(p => p.UploadedBy)
            .Include(p => p.PageAnnotations)
                .ThenInclude(a => a.CreatedBy)
            .Include(p => p.PageRegions) // used for counting tasks
            .Include(p => p.PageVersions)
            .OrderBy(p => p.PageNumber)
            .ToListAsync();

        return pages
            .Select(p =>
            {
                var currentVersionId = GetCurrentVersionId(p);
                var annotations = p.PageAnnotations
                    .Where(a => a.Status == "open" && a.PageVersionId == currentVersionId)
                    .OrderBy(a => a.CreatedAt)
                    .Select(MapAnnotationToDto)
                    .ToList();

                return new PageDto
                {
                    PageId = p.PageId,
                    ChapterId = p.ChapterId,
                    PageNumber = p.PageNumber,
                    CurrentImageUrl = p.CurrentImageUrl,
                    OriginalFileName = p.PageVersions
                    .OrderBy(v => v.VersionNumber)
                    .Select(v => v.FileName)
                    .FirstOrDefault(),
                    Status = p.Status,
                    UploadedById = p.UploadedById,
                    UploadedByName = p.UploadedBy != null ? p.UploadedBy.FullName : null,
                    UploadedAt = p.UploadedAt,
                    AnnotationCount = annotations.Count,
                    Annotations = annotations,
                    TaskCount = _context.Tasks.Count(t => t.PageId == p.PageId)
                };
            })
            .ToList();
    }

    /// <summary>
    /// Upload nhiều trang cùng lúc dưới dạng ảnh (.PNG, .JPG, .JPEG) hoặc file gốc (.PSD, .CLIP).
    /// Business Rule:
    /// - Dung lượng tối đa 50MB/file.
    /// - Tự động tạo số trang (PageNumber) theo thứ tự tăng dần, thread-safe.
    /// </summary>
    public async Task<UploadPagesResponseDto> UploadPages(Guid chapterId, List<IFormFile> files, Guid uploadedById)
    {
        if (files == null || files.Count == 0)
        {
            throw new ArgumentException("Danh sách file tải lên không được trống.");
        }

        var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".psd", ".clip" };
        var maxFileSize = 50 * 1024 * 1024; // 50 MB
        var pageNamePattern = new Regex(@"^page_(\d{3,})$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        var orderedFiles = files
            .Select(file => new
            {
                File = file,
                Extension = Path.GetExtension(file.FileName).ToLowerInvariant(),
                BaseName = Path.GetFileNameWithoutExtension(file.FileName),
            })
            .Select(item => new
            {
                item.File,
                item.Extension,
                item.BaseName,
                Match = pageNamePattern.Match(item.BaseName),
            })
            .ToList();

        foreach (var item in orderedFiles)
        {
            var file = item.File;
            if (!allowedExtensions.Contains(item.Extension))
            {
                throw new ArgumentException($"Định dạng file {file.FileName} không được hỗ trợ. Chỉ chấp nhận .PNG, .JPG, .JPEG, .PSD, .CLIP.");
            }

            if (!item.Match.Success)
            {
                throw new ArgumentException($"Tên file '{file.FileName}' không hợp lệ. Hãy đặt tên liên tiếp theo mẫu page_001, page_002...");
            }

            if (file.Length > maxFileSize)
            {
                throw new ArgumentException($"File {file.FileName} vượt quá kích thước tối đa cho phép là 50MB.");
            }
        }

        var duplicateInBatch = orderedFiles
            .GroupBy(item => item.File.FileName, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(group => group.Count() > 1);
        if (duplicateInBatch != null)
        {
            throw new InvalidOperationException($"Tên page bị trùng trong danh sách tải lên: {duplicateInBatch.Key}");
        }

        var numberedFiles = orderedFiles
            .Select(item => new { item.File, Number = int.Parse(item.Match.Groups[1].Value) })
            .OrderBy(item => item.Number)
            .ToList();
        for (var index = 1; index < numberedFiles.Count; index++)
        {
            if (numberedFiles[index].Number != numberedFiles[index - 1].Number + 1)
            {
                throw new ArgumentException("Các page phải được đặt số liên tiếp, ví dụ page_001, page_002, page_003...");
            }
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var resultDto = new UploadPagesResponseDto();

        // Sử dụng SemaphoreSlim để đảm bảo PageNumber tăng dần thread-safe
        await _uploadLock.WaitAsync();
        try
        {
            var incomingNames = numberedFiles
                .Select(item => item.File.FileName.ToLower())
                .ToList();
            var existingNames = await _context.PageVersions
                .Where(version => version.Page.ChapterId == chapterId)
                .Select(version => version.FileName.ToLower())
                .Where(fileName => incomingNames.Contains(fileName))
                .Distinct()
                .ToListAsync();
            if (existingNames.Count > 0)
            {
                throw new InvalidOperationException($"Chapter đã có page trùng tên: {string.Join(", ", existingNames)}");
            }

            var maxPageNumber = await _context.MangaPages
                .Where(p => p.ChapterId == chapterId)
                .Select(p => (int?)p.PageNumber)
                .MaxAsync() ?? 0;

            if (numberedFiles[0].Number != maxPageNumber + 1)
            {
                throw new ArgumentException($"Tên page tiếp theo phải bắt đầu từ page_{maxPageNumber + 1:D3}.");
            }

            foreach (var numberedFile in numberedFiles)
            {
                var file = numberedFile.File;
                maxPageNumber = numberedFile.Number;

                // Tải hình vẽ trang truyện lên Cloudinary
                var imageUrl = await _storageService.UploadFileAsync(file, "MangaStudio/Pages");

                var page = new MangaPage
                {
                    PageId = Guid.NewGuid(),
                    ChapterId = chapterId,
                    PageNumber = maxPageNumber,
                    CurrentImageUrl = imageUrl, // URL tuyệt đối của Cloudinary
                    Status = "pending",
                    UploadedById = uploadedById,
                    UploadedAt = DateTime.UtcNow
                };

                // Create initial version
                var version = new PageVersion
                {
                    PageVersionId = Guid.NewGuid(),
                    PageId = page.PageId,
                    VersionNumber = 1,
                    FileUrl = imageUrl, // URL tuyệt đối của Cloudinary
                    FileName = file.FileName,
                    FileSizeBytes = file.Length,
                    MimeType = file.ContentType,
                    UploadedById = uploadedById,
                    CreatedAt = DateTime.UtcNow,
                    Note = "Tải lên trang ban đầu"
                };

                _context.MangaPages.Add(page);
                _context.PageVersions.Add(version);

                resultDto.Pages.Add(new PageUploadResultDto
                {
                    PageId = page.PageId,
                    PageNumber = page.PageNumber,
                    ImageUrl = imageUrl,
                    OriginalFileName = file.FileName,
                    Status = page.Status
                });
            }

            await _context.SaveChangesAsync();
            resultDto.TotalUploaded = numberedFiles.Count;
        }
        finally
        {
            _uploadLock.Release();
        }

        return resultDto;
    }

    /// <summary>
    /// Xóa một trang khỏi chương truyện.
    /// </summary>
    public async System.Threading.Tasks.Task DeletePage(Guid pageId, Guid mangakaId)
    {
        var page = await _context.MangaPages
            .Include(p => p.Chapter)
                .ThenInclude(c => c.Series)
            .FirstOrDefaultAsync(p => p.PageId == pageId)
            ?? throw new KeyNotFoundException($"Trang truyện với ID {pageId} không tồn tại.");

        if (page.Chapter.Series.MangakaId != mangakaId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa trang này.");
        }

        // Xóa các dữ liệu liên quan
        var annotations = _context.PageAnnotations.Where(a => a.PageId == pageId);
        _context.PageAnnotations.RemoveRange(annotations);

        var versions = _context.PageVersions.Where(v => v.PageId == pageId);
        _context.PageVersions.RemoveRange(versions);

        var tasks = _context.Tasks.Where(t => t.PageId == pageId);
        _context.Tasks.RemoveRange(tasks);

        _context.MangaPages.Remove(page);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Nộp chương truyện để xem xét xuất bản.
    /// Business Rule: Phải có ít nhất 1 trang mới được nộp.
    /// </summary>
    public async Task<ChapterDto> SubmitChapterForPublishing(Guid chapterId, Guid mangakaId)
    {
        var chapter = await _context.Chapters
            .Include(c => c.Series)
                .ThenInclude(s => s.Tantou)
                    .ThenInclude(t => t!.Role)
            .Include(c => c.TantouReviewedBy)
            .Include(c => c.MangaPages)
            .FirstOrDefaultAsync(c => c.ChapterId == chapterId)
            ?? throw new KeyNotFoundException($"Chương truyện với ID {chapterId} không tồn tại.");

        if (chapter.Series.MangakaId != mangakaId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền nộp chương này.");
        }

        if (chapter.MangaPages.Count == 0)
        {
            throw new InvalidOperationException("Chương truyện phải có ít nhất 1 trang trước khi nộp xuất bản.");
        }

        if (chapter.Series.TantouId == null ||
            chapter.Series.Tantou == null ||
            !chapter.Series.Tantou.IsActive ||
            !string.Equals(chapter.Series.Tantou.Role.Code, "tantou", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Series phai duoc gan Tantou Editor hop le truoc khi submit chapter.");
        }

        if (chapter.MangaPages.Any(p => p.Status != "approved"))
        {
            throw new InvalidOperationException("Tất cả trang truyện phải được duyệt trước khi nộp xuất bản.");
        }

        chapter.Status = "tantou_review";
        chapter.SubmittedForPublishingAt = DateTime.UtcNow;
        chapter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetChapterById(chapter.ChapterId);
    }

    public async Task<ChapterDto> ReviewChapter(Guid chapterId, Guid tantouId, ReviewChapterDto dto)
    {
        var chapter = await _context.Chapters
            .Include(c => c.Series)
            .Include(c => c.MangaPages)
                .ThenInclude(p => p.Tasks)
                    .ThenInclude(t => t.TaskSubmissions)
            .Include(c => c.MangaPages)
                .ThenInclude(p => p.Tasks)
                    .ThenInclude(t => t.PayrollRecords)
            .Include(c => c.MangaPages)
                .ThenInclude(p => p.PageAnnotations)
            .Include(c => c.MangaPages)
                .ThenInclude(p => p.PageVersions)
            .Include(c => c.TantouReviewedBy)
            .FirstOrDefaultAsync(c => c.ChapterId == chapterId)
            ?? throw new KeyNotFoundException($"Khong tim thay chapter voi ID {chapterId}.");

        if (chapter.Series.TantouId != tantouId)
        {
            throw new UnauthorizedAccessException("Chi Tantou duoc gan cho series nay moi duoc review chapter.");
        }

        if (chapter.Status != "tantou_review" && chapter.Status != "revision_requested")
        {
            throw new InvalidOperationException("Chi review duoc chapter dang cho Tantou kiem duyet.");
        }

        var decision = dto.Decision.ToLower();
        chapter.TantouReviewNote = dto.Note;
        chapter.TantouReviewedById = tantouId;
        chapter.TantouReviewedAt = DateTime.UtcNow;
        chapter.UpdatedAt = DateTime.UtcNow;

        if (decision == "approved")
        {
            if (chapter.MangaPages.Count == 0 || chapter.MangaPages.Any(p => p.Status != "approved"))
            {
                throw new InvalidOperationException("Cannot approve chapter while one or more pages are not approved by Mangaka.");
            }

            chapter.Status = "editorial_ready";
            await GeneratePayrollForApprovedChapter(chapter);
        }
        else
        {
            var markedPages = chapter.MangaPages
                .Where(page =>
                {
                    var currentVersionId = GetCurrentVersionId(page);
                    return page.PageAnnotations.Any(annotation =>
                        annotation.CreatedById == tantouId &&
                        annotation.Status == "open" &&
                        annotation.PageVersionId == currentVersionId);
                })
                .OrderBy(page => page.PageNumber)
                .ToList();

            if (markedPages.Count == 0)
            {
                throw new InvalidOperationException("Add and save at least one page mark before requesting revision.");
            }

            chapter.Status = "revision_requested";
            foreach (var page in markedPages)
            {
                page.Status = "revision";
                var currentVersionId = GetCurrentVersionId(page);
                var pageReasons = page.PageAnnotations
                    .Where(annotation =>
                        annotation.CreatedById == tantouId &&
                        annotation.Status == "open" &&
                        annotation.PageVersionId == currentVersionId)
                    .OrderBy(annotation => annotation.CreatedAt)
                    .Select(annotation => annotation.Body.Trim().TrimEnd('.', '!', '?'))
                    .Where(reason => !string.IsNullOrWhiteSpace(reason))
                    .ToList();
                var reasonText = pageReasons.Count > 0
                    ? string.Join("; ", pageReasons)
                    : "The page did not pass Tantou content review";

                var revisableTasks = page.Tasks
                    .Where(task => task.AssigneeId.HasValue
                        && (task.Status == "approved"
                            || task.Status == "submitted"
                            || task.Status == "in_progress"))
                    .ToList();

                foreach (var task in revisableTasks)
                {
                    if (!task.AssigneeId.HasValue)
                    {
                        continue;
                    }

                    var assistantId = task.AssigneeId.Value;
                    task.Status = "revision";
                    task.UpdatedAt = DateTime.UtcNow;

                    foreach (var submission in task.TaskSubmissions
                        .Where(submission => submission.Status == "accepted" || submission.Status == "submitted"))
                    {
                        submission.Status = "revision_requested";
                    }

                    foreach (var payroll in task.PayrollRecords
                        .Where(payroll => payroll.Status != "paid"))
                    {
                        payroll.Status = "failed";
                    }

                    _context.Notifications.Add(new Notification
                    {
                        NotificationId = Guid.NewGuid(),
                        UserId = assistantId,
                        Type = "review_needed",
                        Title = $"Revision required: {chapter.Series.Title} - Chapter {chapter.ChapterNumber}",
                        Message = $"Your accepted task \"{task.Title}\" on page {page.PageNumber} was returned by Tantou review. Reason: {reasonText}. Please revise and resubmit using the same task.",
                        IsRead = false,
                        Link = $"/tasks?taskId={task.TaskId}",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            var pageDetails = markedPages.Select(page =>
            {
                var currentVersionId = GetCurrentVersionId(page);
                var reasons = page.PageAnnotations
                    .Where(annotation =>
                        annotation.CreatedById == tantouId &&
                        annotation.Status == "open" &&
                        annotation.PageVersionId == currentVersionId)
                    .OrderBy(annotation => annotation.CreatedAt)
                    .Select(annotation => annotation.Body.Trim().TrimEnd('.', '!', '?'))
                    .Where(reason => !string.IsNullOrWhiteSpace(reason));
                return $"Page {page.PageNumber}: {string.Join("; ", reasons)}";
            });

            var chapterNote = string.IsNullOrWhiteSpace(dto.Note)
                ? "No chapter note provided"
                : dto.Note.Trim().TrimEnd('.', '!', '?');

            _context.Notifications.Add(new Notification
            {
                NotificationId = Guid.NewGuid(),
                UserId = chapter.Series.MangakaId,
                Type = "review_needed",
                Title = $"Revision requested for {chapter.Series.Title} - Chapter {chapter.ChapterNumber}",
                Message = $"Pages requiring revision: {string.Join(" | ", pageDetails)}. Chapter note: {chapterNote}.",
                IsRead = false,
                Link = $"/chapters/{chapter.ChapterId}",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return await GetChapterById(chapter.ChapterId);
    }

    private async System.Threading.Tasks.Task GeneratePayrollForApprovedChapter(Chapter chapter)
    {
        var approvedTasks = chapter.MangaPages
            .SelectMany(p => p.Tasks)
            .Where(t => t.AssigneeId.HasValue && string.Equals(t.Status, "approved", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (!approvedTasks.Any())
        {
            return;
        }

        // If a page was revised, a Mangaka may create a replacement task for the
        // same assistant/page/type. Only the latest approved task should be paid.
        var payableTasks = approvedTasks
            .GroupBy(t => new { t.AssigneeId, t.PageId, Type = t.Type.ToLower() })
            .Select(g => g.OrderByDescending(t => t.UpdatedAt).ThenByDescending(t => t.CreatedAt).First())
            .ToList();

        var approvedTaskIds = payableTasks.Select(t => t.TaskId).ToList();
        var existingPayrollTaskIds = await _context.PayrollRecords
            .Where(p => p.TaskId.HasValue && approvedTaskIds.Contains(p.TaskId.Value))
            .Select(p => p.TaskId!.Value)
            .ToListAsync();

        var existingSet = existingPayrollTaskIds.ToHashSet();
        var periodDate = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var task in payableTasks.Where(t => !existingSet.Contains(t.TaskId)))
        {
            var totalAmount = task.PaymentAmount;
            _context.PayrollRecords.Add(new PayrollRecord
            {
                PayrollRecordId = Guid.NewGuid(),
                AssistantId = task.AssigneeId!.Value,
                TaskId = task.TaskId,
                PeriodStart = periodDate,
                PeriodEnd = periodDate,
                BaseAmount = task.PaymentAmount,
                BonusAmount = 0,
                DeductionAmount = 0,
                TotalAmount = totalAmount,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    public async Task<ChapterVersionCompareDto> GetChapterVersions(Guid chapterId)
    {
        var chapter = await _context.Chapters
            .Include(c => c.MangaPages)
                .ThenInclude(p => p.PageVersions)
                    .ThenInclude(v => v.UploadedBy)
            .Include(c => c.MangaPages)
                .ThenInclude(p => p.PageVersions)
                    .ThenInclude(v => v.PageAnnotations)
                        .ThenInclude(a => a.CreatedBy)
            .FirstOrDefaultAsync(c => c.ChapterId == chapterId)
            ?? throw new KeyNotFoundException($"Chapter with ID {chapterId} was not found.");

        var revisionMarker = chapter.TantouReviewedAt ?? chapter.SubmittedForPublishingAt ?? DateTime.MinValue;

        return new ChapterVersionCompareDto
        {
            ChapterId = chapter.ChapterId,
            ChapterNumber = chapter.ChapterNumber,
            Title = chapter.Title,
            Status = chapter.Status,
            TantouReviewedAt = chapter.TantouReviewedAt,
            Pages = chapter.MangaPages
                .OrderBy(p => p.PageNumber)
                .Select(p =>
                {
                    var latestVersion = p.PageVersions.OrderByDescending(v => v.VersionNumber).FirstOrDefault();
                    return new ChapterVersionPageDto
                    {
                        PageId = p.PageId,
                        PageNumber = p.PageNumber,
                        Status = p.Status,
                        CurrentImageUrl = p.CurrentImageUrl ?? string.Empty,
                        ChangedAfterRevision = p.Status == "revision" || (latestVersion != null && p.PageVersions.Count > 1 && latestVersion.CreatedAt >= revisionMarker),
                        Versions = p.PageVersions
                            .OrderByDescending(v => v.VersionNumber)
                            .Select(v => new PageVersionOptionDto
                            {
                                PageVersionId = v.PageVersionId,
                                PageId = v.PageId,
                                VersionNumber = v.VersionNumber,
                                FileUrl = v.FileUrl,
                                FileName = v.FileName,
                                FileSizeBytes = v.FileSizeBytes,
                                MimeType = v.MimeType,
                                UploadedById = v.UploadedById,
                                UploadedByName = v.UploadedBy?.FullName ?? "Unknown",
                                CreatedAt = v.CreatedAt,
                                Note = v.Note,
                                IsCurrent = v.FileUrl == p.CurrentImageUrl,
                                Annotations = v.PageAnnotations
                                    .OrderBy(a => a.CreatedAt)
                                    .Select(MapAnnotationToDto)
                                    .ToList()
                            })
                            .ToList()
                    };
                })
                .ToList()
        };
    }

    public async Task<List<ChapterAuditEventDto>> GetChapterAuditTimeline(Guid chapterId)
    {
        var pageIds = await _context.MangaPages
            .Where(p => p.ChapterId == chapterId)
            .Select(p => p.PageId)
            .ToListAsync();

        var chapterIdText = chapterId.ToString();

        return await _context.AuditLogs
            .Include(a => a.User)
            .Where(a =>
                (a.EntityType == "chapter" && a.EntityId == chapterId) ||
                (a.EntityType == "page" && a.EntityId != null && pageIds.Contains(a.EntityId.Value)) ||
                (a.DetailsJson != null && a.DetailsJson.Contains(chapterIdText)))
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ChapterAuditEventDto
            {
                AuditLogId = a.AuditLogId,
                UserId = a.UserId,
                UserName = a.User != null ? a.User.FullName : null,
                Action = a.Action,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                DetailsJson = a.DetailsJson,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();
    }

    private static ChapterDto MapToDto(Chapter c)
    {
        return new ChapterDto
        {
            ChapterId = c.ChapterId,
            SeriesId = c.SeriesId,
            SeriesTitle = c.Series?.Title ?? "Unknown",
            ChapterNumber = c.ChapterNumber,
            Title = c.Title,
            Status = c.Status,
            DueDate = c.DueDate.HasValue ? c.DueDate.Value.ToDateTime(TimeOnly.MinValue) : null,
            SubmittedForPublishingAt = c.SubmittedForPublishingAt,
            TantouReviewNote = c.TantouReviewNote,
            TantouReviewedById = c.TantouReviewedById,
            TantouReviewedByName = c.TantouReviewedBy?.FullName,
            TantouReviewedAt = c.TantouReviewedAt,
            PageCount = c.MangaPages?.Count ?? 0,
            ApprovedPageCount = c.MangaPages?.Count(p => p.Status == "approved") ?? 0,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }

    private static Guid? GetCurrentVersionId(MangaPage page)
    {
        return page.PageVersions
            .OrderByDescending(v => v.VersionNumber)
            .FirstOrDefault(v => v.FileUrl == page.CurrentImageUrl)?.PageVersionId;
    }

    private static AnnotationDto MapAnnotationToDto(PageAnnotation annotation)
    {
        return new AnnotationDto
        {
            AnnotationId = annotation.AnnotationId,
            PageId = annotation.PageId,
            PageVersionId = annotation.PageVersionId,
            CreatedById = annotation.CreatedById,
            CreatedByName = annotation.CreatedBy?.FullName ?? "",
            X = annotation.X,
            Y = annotation.Y,
            Width = annotation.Width,
            Height = annotation.Height,
            Body = annotation.Body,
            Status = annotation.Status,
            CreatedAt = annotation.CreatedAt,
            ResolvedAt = annotation.ResolvedAt
        };
    }
}
