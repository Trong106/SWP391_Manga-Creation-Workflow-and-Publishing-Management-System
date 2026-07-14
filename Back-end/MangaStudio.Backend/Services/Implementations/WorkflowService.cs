using Microsoft.EntityFrameworkCore;
using MangaStudio.Backend.Data;
using MangaStudio.Backend.Models.DTOs;
using MangaStudio.Backend.Models.Entities;
using MangaStudio.Backend.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MangaStudio.Backend.Services.Implementations;

/// <summary>
/// Triển khai nghiệp vụ quản lý đề xuất series, lịch xuất bản và bảng lương.
/// </summary>
public class WorkflowService : IWorkflowService
{
    private readonly AppDbContext _context;

    public WorkflowService(AppDbContext context)
    {
        _context = context;
    }

    // === Series Proposals ===

    private async System.Threading.Tasks.Task CleanUpApprovedSeriesProposals()
    {
        // Tìm toàn bộ các đề xuất bị từ chối (rejected) có cùng Tên truyện và cùng Mangaka với một đề xuất đã được đồng ý (approved)
        var rejectedProposals = await _context.SeriesProposals
            .Include(p => p.Series)
            .Where(rp => rp.Status == "rejected" &&
                         _context.SeriesProposals.Any(ap => ap.Status == "approved" &&
                                                             ap.SubmittedById == rp.SubmittedById &&
                                                             ap.Series.Title == rp.Series.Title))
            .ToListAsync();

        if (rejectedProposals.Any())
        {
            var rejectedSeriesIds = rejectedProposals.Select(p => p.SeriesId).ToList();
            var rejectedSeries = rejectedProposals.Select(p => p.Series).Where(s => s != null).ToList();

            // 1. Xóa các đề xuất con trước
            _context.SeriesProposals.RemoveRange(rejectedProposals);
            await _context.SaveChangesAsync();

            // 2. Xóa các thể loại liên kết
            var rejectedGenres = await _context.SeriesGenres
                .Where(g => rejectedSeriesIds.Contains(g.SeriesId))
                .ToListAsync();

            if (rejectedGenres.Any())
            {
                _context.SeriesGenres.RemoveRange(rejectedGenres);
            }

            // 3. Xóa các bản ghi truyện cha
            if (rejectedSeries.Any())
            {
                _context.Series.RemoveRange(rejectedSeries);
            }

            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Lấy danh sách đề xuất chờ duyệt (status = 'submitted').
    /// </summary>
    public async Task<List<ProposalDto>> GetPendingProposals()
    {
        await CleanUpApprovedSeriesProposals();
        return await _context.SeriesProposals
            .Include(p => p.Series)
                .ThenInclude(s => s.SeriesGenres)
            .Include(p => p.SubmittedBy)
            .Include(p => p.ReviewedBy)
            .OrderByDescending(p => p.SubmittedAt)
            .Select(p => MapProposalToDto(p))
            .ToListAsync();
    }

    /// <summary>
    /// Lấy danh sách đề xuất của một Mangaka.
    /// </summary>
    public async Task<List<ProposalDto>> GetProposalsByMangaka(Guid mangakaId)
    {
        await CleanUpApprovedSeriesProposals();
        return await _context.SeriesProposals
            .Where(p => p.SubmittedById == mangakaId)
            .Include(p => p.Series)
                .ThenInclude(s => s.SeriesGenres)
            .Include(p => p.SubmittedBy)
            .Include(p => p.ReviewedBy)
            .OrderByDescending(p => p.SubmittedAt)
            .Select(p => MapProposalToDto(p))
            .ToListAsync();
    }

    /// <summary>
    /// Tantou phê duyệt hoặc từ chối đề xuất series.
    /// Business Rule:
    /// - Nếu approved -> Series.Status = 'active' và gán TantouId cho Series.
    /// - Cập nhật thông tin người duyệt, thời gian duyệt và feedback.
    /// </summary>
    public async Task<ProposalDto> ReviewProposal(Guid proposalId, Guid reviewerId, ReviewProposalDto dto)
    {
        var proposal = await _context.SeriesProposals
            .Include(p => p.Series)
                .ThenInclude(s => s.SeriesGenres)
            .Include(p => p.SubmittedBy)
            .FirstOrDefaultAsync(p => p.ProposalId == proposalId)
            ?? throw new KeyNotFoundException($"Không tìm thấy đề xuất với ID {proposalId}");

        var decision = dto.Decision.ToLower();
        proposal.Status = decision;
        proposal.ReviewedById = reviewerId;
        proposal.ReviewedAt = DateTime.UtcNow;
        proposal.ReviewNote = dto.Feedback;

        if (decision == "approved")
        {
            if (!dto.TantouId.HasValue)
            {
                throw new InvalidOperationException("Phai chon Tantou Editor khi approve series proposal.");
            }

            var tantou = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == dto.TantouId.Value && u.Role.Code == "tantou" && u.IsActive)
                ?? throw new InvalidOperationException("Tantou Editor duoc chon khong hop le hoac da bi vo hieu hoa.");

            proposal.Series.Status = "active"; // BR-Proposal
            proposal.Series.TantouId = tantou.UserId;

            // Xóa các đề xuất bị từ chối (rejected) cũ của bộ truyện này (trùng tên và trùng Mangaka)
            var title = proposal.Series.Title;
            var mangakaId = proposal.SubmittedById;

            var oldRejectedProposals = await _context.SeriesProposals
                .Where(p => p.Status == "rejected" && p.SubmittedById == mangakaId && p.Series.Title == title && p.ProposalId != proposalId)
                .Include(p => p.Series)
                .ToListAsync();

            if (oldRejectedProposals.Any())
            {
                var rejectedSeriesIds = oldRejectedProposals.Select(p => p.SeriesId).ToList();
                var rejectedSeries = oldRejectedProposals.Select(p => p.Series).Where(s => s != null).ToList();

                // Delete the proposals (child records) first
                _context.SeriesProposals.RemoveRange(oldRejectedProposals);
                await _context.SaveChangesAsync();

                // Now delete genres and series
                var rejectedGenres = await _context.SeriesGenres
                    .Where(g => rejectedSeriesIds.Contains(g.SeriesId))
                    .ToListAsync();

                if (rejectedGenres.Any())
                {
                    _context.SeriesGenres.RemoveRange(rejectedGenres);
                }

                if (rejectedSeries.Any())
                {
                    _context.Series.RemoveRange(rejectedSeries);
                }

                await _context.SaveChangesAsync();
            }
        }
        else if (decision == "rejected")
        {
            proposal.Series.Status = "proposal"; // Revert/Keep proposal
        }

        proposal.Series.UpdatedAt = DateTime.UtcNow;

        // Create notification for Mangaka
        var notificationTitle = decision == "approved" ? "Series Proposal Approved!" : "Series Proposal Rejected";
        var notificationMessage = decision == "approved"
            ? $"Your series proposal '{proposal.Series.Title}' has been approved. Tantou Editor has been assigned."
            : $"Your series proposal '{proposal.Series.Title}' was rejected. Reason: {dto.Feedback}";

        _context.Notifications.Add(new Notification
        {
            NotificationId = Guid.NewGuid(),
            UserId = proposal.SubmittedById,
            Type = "system",
            Title = notificationTitle,
            Message = notificationMessage,
            IsRead = false,
            Link = "/series",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        // Load reviewer details
        var reviewedBy = await _context.Users.FindAsync(reviewerId);
        proposal.ReviewedBy = reviewedBy;

        return MapProposalToDto(proposal);
    }

    public async Task<List<UserOptionDto>> GetUsersByRole(string roleCode)
    {
        return await _context.Users
            .Include(u => u.Role)
            .Where(u => u.IsActive && u.Role.Code == roleCode)
            .OrderBy(u => u.FullName)
            .Select(u => new UserOptionDto
            {
                UserId = u.UserId,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role.Code
            })
            .ToListAsync();
    }

    // === Publish Schedule ===

    /// <summary>
    /// Lấy tất cả lịch xuất bản (có thể lọc theo series).
    /// </summary>
    public async Task<List<PublishScheduleDto>> GetPublishSchedules(Guid? seriesId = null)
    {
        await PublishDueSchedules();

        var query = _context.PublishSchedules
            .Include(s => s.ApprovedBy)
            .Include(s => s.Chapter)
                .ThenInclude(c => c.Series)
            .AsQueryable();

        if (seriesId.HasValue)
        {
            query = query.Where(s => s.Chapter.SeriesId == seriesId.Value);
        }

        return await query
            .OrderBy(s => s.ScheduledDate)
            .Select(s => MapPublishScheduleToDto(s))
            .ToListAsync();
    }

    /// <summary>
    /// Tạo lịch xuất bản cho một chương truyện.
    /// </summary>
    public async Task<PublishScheduleDto> CreatePublishSchedule(Guid chapterId, Guid createdById, CreatePublishScheduleDto dto)
    {
        var scheduledUtc = dto.ScheduledDate.Kind switch
        {
            DateTimeKind.Utc => dto.ScheduledDate,
            DateTimeKind.Local => dto.ScheduledDate.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dto.ScheduledDate, DateTimeKind.Utc)
        };

        if (scheduledUtc <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Thoi gian xuat ban phai nam trong tuong lai.");
        }

        var chapter = await _context.Chapters
            .Include(c => c.Series)
            .FirstOrDefaultAsync(c => c.ChapterId == chapterId)
            ?? throw new KeyNotFoundException($"Không tìm thấy chương với ID {chapterId}");

        if (chapter.Status != "editorial_ready")
        {
            throw new InvalidOperationException("Chi chapter da duoc Tantou approve moi duoc len lich xuat ban.");
        }

        // Tạo lịch xuất bản với status mặc định là 'scheduled'
        var schedule = new PublishSchedule
        {
            PublishScheduleId = Guid.NewGuid(),
            ChapterId = chapterId,
            ScheduledDate = scheduledUtc,
            Status = "scheduled",
            CreatedAt = DateTime.UtcNow
        };

        _context.PublishSchedules.Add(schedule);
        await _context.SaveChangesAsync();

        return await GetPublishScheduleById(schedule.PublishScheduleId);
    }

    /// <summary>
    /// Tantou phê duyệt lịch xuất bản.
    /// </summary>
    public async Task<PublishScheduleDto> ApprovePublishSchedule(Guid scheduleId, Guid editorialId)
    {
        var schedule = await _context.PublishSchedules
            .Include(s => s.Chapter)
                .ThenInclude(c => c.Series)
            .FirstOrDefaultAsync(s => s.PublishScheduleId == scheduleId)
            ?? throw new KeyNotFoundException($"Không tìm thấy lịch xuất bản với ID {scheduleId}");

        if (string.Equals(schedule.Status, "published", StringComparison.OrdinalIgnoreCase))
        {
            return await GetPublishScheduleById(schedule.PublishScheduleId);
        }

        MarkSchedulePublished(schedule, editorialId);
        
        await _context.SaveChangesAsync();

        return await GetPublishScheduleById(schedule.PublishScheduleId);
    }

    private async System.Threading.Tasks.Task PublishDueSchedules()
    {
        var dueSchedules = await _context.PublishSchedules
            .Include(s => s.Chapter)
                .ThenInclude(c => c.Series)
            .Where(s => s.Status == "scheduled" && s.ScheduledDate <= DateTime.UtcNow)
            .ToListAsync();

        foreach (var schedule in dueSchedules)
        {
            MarkSchedulePublished(schedule, null);
        }

        if (dueSchedules.Any())
        {
            await _context.SaveChangesAsync();
        }
    }

    private void MarkSchedulePublished(PublishSchedule schedule, Guid? editorialId)
    {
        schedule.ApprovedById = editorialId;
        schedule.Status = "published";
        schedule.PublishedAt = DateTime.UtcNow;
        if (schedule.Chapter == null) return;

        schedule.Chapter.Status = "published";
        schedule.Chapter.SubmittedForPublishingAt ??= DateTime.UtcNow;
        schedule.Chapter.UpdatedAt = DateTime.UtcNow;

        var series = schedule.Chapter.Series;
        var publishDate = schedule.ScheduledDate.ToString("yyyy-MM-dd HH:mm 'UTC'");
        _context.Notifications.Add(new Notification
        {
            NotificationId = Guid.NewGuid(),
            UserId = series.MangakaId,
            Type = "system",
            Title = "Chapter published",
            Message = $"{series.Title} chapter {schedule.Chapter.ChapterNumber} has been published for {publishDate}.",
            IsRead = false,
            Link = $"/chapters/{schedule.Chapter.ChapterId}",
            CreatedAt = DateTime.UtcNow
        });
    }

    // === Payroll ===

    /// <summary>
    /// Lấy danh sách bảng lương trợ lý. Mangaka xem được tất cả, trợ lý xem của chính mình.
    /// </summary>
    public async Task<List<PayrollDto>> GetPayrollRecords(Guid? assistantId = null, Guid? mangakaId = null)
    {
        var query = _context.PayrollRecords
            .Include(p => p.Assistant)
            .Include(p => p.Task)
                .ThenInclude(t => t!.Page)
                    .ThenInclude(p => p.Chapter)
                        .ThenInclude(c => c.Series)
            .AsQueryable();

        if (assistantId.HasValue)
        {
            query = query.Where(p => p.AssistantId == assistantId.Value);
        }

        if (mangakaId.HasValue)
        {
            query = query.Where(p => p.Task != null && p.Task.AssignerId == mangakaId.Value);
        }

        var records = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return records
            .GroupBy(p => p.Task == null
                ? $"payroll:{p.PayrollRecordId}"
                : $"{p.AssistantId}:{p.Task.Page.ChapterId}:{p.Task.PageId}:{p.Task.Type.ToLower()}")
            .Select(g => g
                .OrderByDescending(p => p.Task?.UpdatedAt ?? p.CreatedAt)
                .ThenByDescending(p => p.CreatedAt)
                .First())
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PayrollDto
            {
                PayrollRecordId = p.PayrollRecordId,
                AssistantId = p.AssistantId,
                AssistantName = p.Assistant.FullName,
                TaskId = p.TaskId,
                TaskTitle = p.Task != null ? p.Task.Title : null,
                TaskType = p.Task != null ? p.Task.Type : null,
                SeriesTitle = p.Task != null ? p.Task.Page.Chapter.Series.Title : null,
                ChapterNumber = p.Task != null ? p.Task.Page.Chapter.ChapterNumber : null,
                ChapterTitle = p.Task != null ? p.Task.Page.Chapter.Title : null,
                PageNumber = p.Task != null ? p.Task.Page.PageNumber : null,
                PeriodStart = p.PeriodStart,
                PeriodEnd = p.PeriodEnd,
                BaseAmount = p.BaseAmount,
                BonusAmount = p.BonusAmount,
                DeductionAmount = p.DeductionAmount,
                TotalAmount = p.TotalAmount ?? (p.BaseAmount + p.BonusAmount - p.DeductionAmount),
                Status = p.Status,
                PaidAt = p.PaidAt,
                CreatedAt = p.CreatedAt
            })
            .ToList();
    }

    public async Task<List<AssistantPayrollMonthDto>> GetAssistantPayrollMonths(Guid assistantId)
    {
        var submissions = await _context.TaskSubmissions
            .Include(s => s.Task)
                .ThenInclude(t => t.Page)
            .Where(s => s.SubmittedById == assistantId)
            .ToListAsync();

        var latestMonthlySubmissions = submissions
            .GroupBy(s => new { s.TaskId, s.SubmittedAt.Year, s.SubmittedAt.Month })
            .Select(g => g.OrderByDescending(s => s.SubmittedAt).First())
            .ToList();

        var taskIds = latestMonthlySubmissions.Select(s => s.TaskId).Distinct().ToList();
        var payrollRecords = await _context.PayrollRecords
            .Where(p =>
                p.AssistantId == assistantId &&
                p.TaskId.HasValue &&
                taskIds.Contains(p.TaskId.Value) &&
                p.Task != null &&
                p.Task.Status == "approved" &&
                p.Status != "failed")
            .ToListAsync();

        var payableByTask = payrollRecords
            .GroupBy(p => p.TaskId!.Value)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(p => p.CreatedAt).First());

        return latestMonthlySubmissions
            .GroupBy(s => new { s.SubmittedAt.Year, s.SubmittedAt.Month })
            .Select(g =>
            {
                var tasks = g
                    .OrderByDescending(s => s.SubmittedAt)
                    .Select(s =>
                    {
                        payableByTask.TryGetValue(s.TaskId, out var payroll);
                        var status = payroll != null
                            ? "Approved"
                            : IsRevisionStatus(s.Task.Status)
                                ? "Revision Required"
                                : "Submitted";

                        return new AssistantPayrollTaskDto
                        {
                            TaskId = s.TaskId,
                            TaskName = s.Task.Title,
                            TaskType = s.Task.Type,
                            PageNumber = s.Task.Page?.PageNumber,
                            Status = status,
                            SubmittedAt = s.SubmittedAt,
                            ApprovedDate = payroll != null ? s.Task.ApprovedAt ?? s.Task.UpdatedAt : null,
                            Payment = payroll != null
                                ? payroll.TotalAmount ?? (payroll.BaseAmount - payroll.DeductionAmount)
                                : 0
                        };
                    })
                    .ToList();

                return new AssistantPayrollMonthDto
                {
                    Month = $"{g.Key.Month:00}/{g.Key.Year}",
                    Year = g.Key.Year,
                    MonthNumber = g.Key.Month,
                    CompletedTasks = tasks.Count,
                    ApprovedTasks = tasks.Count(t => t.Status == "Approved"),
                    MonthlyIncome = tasks.Sum(t => t.Payment),
                    Tasks = tasks
                };
            })
            .OrderByDescending(m => m.Year)
            .ThenByDescending(m => m.MonthNumber)
            .ToList();
    }

    private static bool IsRevisionStatus(string status)
    {
        return string.Equals(status, "revision", StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, "revision_requested", StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, "rejected", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Mangaka đánh dấu đã thanh toán lương cho trợ lý.
    /// Business Rule: Chỉ thanh toán khi status là 'pending'.
    /// </summary>
    public async Task<PayrollDto> MarkPayrollAsPaid(Guid payrollRecordId, Guid mangakaId)
    {
        var record = await _context.PayrollRecords
            .Include(p => p.Assistant)
            .Include(p => p.Task)
            .FirstOrDefaultAsync(p => p.PayrollRecordId == payrollRecordId)
            ?? throw new KeyNotFoundException($"Không tìm thấy bản ghi lương với ID {payrollRecordId}");

        if (record.Task == null || record.Task.AssignerId != mangakaId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền thanh toán bản ghi lương này.");
        }

        if (record.Status != "pending")
        {
            throw new InvalidOperationException("Chỉ được thanh toán các bản ghi lương đang ở trạng thái 'pending'.");
        }

        record.Status = "paid";
        record.PaidAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new PayrollDto
        {
            PayrollRecordId = record.PayrollRecordId,
            AssistantId = record.AssistantId,
            AssistantName = record.Assistant.FullName,
            TaskId = record.TaskId,
            TaskTitle = record.Task != null ? record.Task.Title : null,
            TaskType = record.Task != null ? record.Task.Type : null,
            PeriodStart = record.PeriodStart,
            PeriodEnd = record.PeriodEnd,
            BaseAmount = record.BaseAmount,
            BonusAmount = record.BonusAmount,
            DeductionAmount = record.DeductionAmount,
            TotalAmount = record.TotalAmount ?? (record.BaseAmount + record.BonusAmount - record.DeductionAmount),
            Status = record.Status,
            PaidAt = record.PaidAt,
            CreatedAt = record.CreatedAt
        };
    }

    private async Task<PublishScheduleDto> GetPublishScheduleById(Guid scheduleId)
    {
        var s = await _context.PublishSchedules
            .Include(s => s.ApprovedBy)
            .Include(s => s.Chapter)
                .ThenInclude(c => c.Series)
            .FirstOrDefaultAsync(s => s.PublishScheduleId == scheduleId)
            ?? throw new KeyNotFoundException();
        return MapPublishScheduleToDto(s);
    }

    private static ProposalDto MapProposalToDto(SeriesProposal p)
    {
        return new ProposalDto
        {
            ProposalId = p.ProposalId,
            SeriesId = p.SeriesId,
            SeriesTitle = p.Series?.Title ?? "Unknown",
            SeriesSynopsis = p.ProposalSynopsis ?? p.Series?.Synopsis,
            SeriesGenres = p.Series?.SeriesGenres?.Select(g => g.Genre).ToList() ?? new List<string>(),
            SubmittedById = p.SubmittedById,
            SubmittedByName = p.SubmittedBy?.FullName ?? "Unknown",
            ReviewedById = p.ReviewedById,
            ReviewedByName = p.ReviewedBy?.FullName,
            Status = p.Status,
            Feedback = p.ReviewNote, // mapped from ReviewNote in DB
            SubmittedAt = p.SubmittedAt,
            ReviewedAt = p.ReviewedAt,
            CoverImageUrl = p.Series?.CoverImageUrl,
            Ranking = p.Series?.Ranking,
            ReaderCount = p.Series?.ReaderCount ?? 0,
            Rating = p.Series?.Rating
        };
    }

    private static PublishScheduleDto MapPublishScheduleToDto(PublishSchedule s)
    {
        return new PublishScheduleDto
        {
            ScheduleId = s.PublishScheduleId,
            ChapterId = s.ChapterId,
            ChapterNumber = s.Chapter?.ChapterNumber ?? 0,
            ChapterTitle = s.Chapter?.Title,
            SeriesTitle = s.Chapter?.Series?.Title ?? "Unknown",
            ScheduledDate = s.ScheduledDate,
            Status = s.Status,
            ApprovedById = s.ApprovedById,
            ApprovedByName = s.ApprovedBy?.FullName,
            PublishedAt = s.PublishedAt,
            CreatedAt = s.CreatedAt,
            CoverImageUrl = s.Chapter?.Series?.CoverImageUrl,
            AuthorName = s.Chapter?.Series?.Mangaka?.FullName,
            Rating = s.Chapter?.Series?.Rating,
            ReaderCount = s.Chapter?.Series?.ReaderCount ?? 0,
            ChapterStatus = s.Chapter?.Status
        };
    }

    // === Notifications ===

    public async Task<List<NotificationDto>> GetNotifications(Guid userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto
            {
                Id = n.NotificationId,
                UserId = n.UserId,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                Link = n.Link,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<bool> MarkAsRead(Guid id, Guid userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == id && n.UserId == userId);

        if (notification == null) return false;

        notification.IsRead = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkAllAsRead(Guid userId)
    {
        var unread = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (!unread.Any()) return true;

        foreach (var n in unread)
        {
            n.IsRead = true;
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
