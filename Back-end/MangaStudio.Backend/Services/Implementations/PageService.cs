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
/// Triển khai nghiệp vụ quản lý ghi chú (annotation) và đánh giá (review) trang.
/// </summary>
public class PageService : IPageService
{
    private readonly AppDbContext _context;

    public PageService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy chi tiết thông tin trang truyện.
    /// </summary>
    public async Task<PageDto> GetPageById(Guid pageId)
    {
        var page = await _context.MangaPages
            .Include(p => p.UploadedBy)
            .Include(p => p.PageAnnotations)
            .FirstOrDefaultAsync(p => p.PageId == pageId)
            ?? throw new KeyNotFoundException($"Trang truyện với ID {pageId} không tồn tại.");

        var taskCount = await _context.Tasks.CountAsync(t => t.PageId == pageId);

        return new PageDto
        {
            PageId = page.PageId,
            ChapterId = page.ChapterId,
            PageNumber = page.PageNumber,
            CurrentImageUrl = page.CurrentImageUrl,
            Status = page.Status,
            UploadedById = page.UploadedById,
            UploadedByName = page.UploadedBy?.FullName,
            UploadedAt = page.UploadedAt,
            AnnotationCount = page.PageAnnotations.Count,
            TaskCount = taskCount
        };
    }

    /// <summary>
    /// Lấy danh sách ghi chú (annotation) của trang.
    /// </summary>
    public async Task<List<AnnotationDto>> GetAnnotations(Guid pageId)
    {
        return await _context.PageAnnotations
            .Where(a => a.PageId == pageId)
            .Include(a => a.CreatedBy)
            .OrderBy(a => a.CreatedAt)
            .Select(a => new AnnotationDto
            {
                AnnotationId = a.AnnotationId,
                PageId = a.PageId,
                CreatedById = a.CreatedById,
                CreatedByName = a.CreatedBy.FullName,
                X = a.X,
                Y = a.Y,
                Width = a.Width,
                Height = a.Height,
                Body = a.Body,
                Status = a.Status,
                CreatedAt = a.CreatedAt,
                ResolvedAt = a.ResolvedAt
            })
            .ToListAsync();
    }

    /// <summary>
    /// Tạo ghi chú (annotation) mới trên trang.
    /// </summary>
    public async Task<AnnotationDto> CreateAnnotation(Guid pageId, Guid createdById, CreateAnnotationDto dto)
    {
        var page = await _context.MangaPages
            .Include(p => p.Chapter)
                .ThenInclude(c => c.Series)
            .FirstOrDefaultAsync(p => p.PageId == pageId)
            ?? throw new KeyNotFoundException($"Page {pageId} was not found.");

        var isMangaka = page.Chapter.Series.MangakaId == createdById;
        var isAssignedTantou = page.Chapter.Series.TantouId == createdById;
        if (!isMangaka && !isAssignedTantou)
        {
            throw new UnauthorizedAccessException("You do not have permission to annotate this page.");
        }

        var annotation = new PageAnnotation
        {
            AnnotationId = Guid.NewGuid(),
            PageId = pageId,
            CreatedById = createdById,
            X = dto.X,
            Y = dto.Y,
            Width = dto.Width,
            Height = dto.Height,
            Body = dto.Body,
            Status = "open",
            CreatedAt = DateTime.UtcNow
        };

        _context.PageAnnotations.Add(annotation);

        if (isAssignedTantou)
        {
            page.Status = "revision";
            page.Chapter.UpdatedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();

        var creator = await _context.Users.FindAsync(createdById);

        return new AnnotationDto
        {
            AnnotationId = annotation.AnnotationId,
            PageId = annotation.PageId,
            CreatedById = annotation.CreatedById,
            CreatedByName = creator?.FullName ?? "Unknown",
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

    /// <summary>
    /// Giải quyết ghi chú (resolve annotation).
    /// </summary>
    public async Task<AnnotationDto> ResolveAnnotation(Guid annotationId, Guid userId)
    {
        var annotation = await _context.PageAnnotations
            .Include(a => a.CreatedBy)
            .FirstOrDefaultAsync(a => a.AnnotationId == annotationId)
            ?? throw new KeyNotFoundException($"Ghi chú với ID {annotationId} không tồn tại.");

        annotation.Status = "resolved";
        annotation.ResolvedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new AnnotationDto
        {
            AnnotationId = annotation.AnnotationId,
            PageId = annotation.PageId,
            CreatedById = annotation.CreatedById,
            CreatedByName = annotation.CreatedBy.FullName,
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

    public async System.Threading.Tasks.Task DeleteAnnotation(Guid annotationId, Guid userId)
    {
        var annotation = await _context.PageAnnotations
            .Include(a => a.Page)
                .ThenInclude(page => page.Chapter)
                    .ThenInclude(chapter => chapter.Series)
            .FirstOrDefaultAsync(a => a.AnnotationId == annotationId)
            ?? throw new KeyNotFoundException($"Annotation {annotationId} was not found.");

        if (annotation.CreatedById != userId || annotation.Page.Chapter.Series.TantouId != userId)
        {
            throw new UnauthorizedAccessException("You can only delete your own review marks for an assigned series.");
        }

        if (annotation.Status != "open")
        {
            throw new InvalidOperationException("Only open review marks can be deleted.");
        }

        var hasOtherOpenMarks = await _context.PageAnnotations.AnyAsync(a =>
            a.PageId == annotation.PageId &&
            a.AnnotationId != annotationId &&
            a.CreatedById == userId &&
            a.Status == "open");

        _context.PageAnnotations.Remove(annotation);
        if (!hasOtherOpenMarks && annotation.Page.Chapter.Status == "tantou_review")
        {
            annotation.Page.Status = "approved";
            annotation.Page.Chapter.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Lấy danh sách review của trang.
    /// </summary>
    public async Task<List<PageReviewDto>> GetPageReviews(Guid pageId)
    {
        return await _context.PageReviews
            .Where(r => r.PageId == pageId)
            .Include(r => r.Reviewer)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new PageReviewDto
            {
                ReviewId = r.ReviewId,
                PageId = r.PageId,
                ReviewerId = r.ReviewerId,
                ReviewerName = r.Reviewer.FullName,
                Decision = r.Decision,
                Note = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<PageVersionOptionDto>> GetPageVersions(Guid pageId)
    {
        var page = await _context.MangaPages
            .FirstOrDefaultAsync(p => p.PageId == pageId)
            ?? throw new KeyNotFoundException($"Page with ID {pageId} was not found.");

        return await _context.PageVersions
            .Where(v => v.PageId == pageId)
            .Include(v => v.UploadedBy)
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
                UploadedByName = v.UploadedBy.FullName,
                CreatedAt = v.CreatedAt,
                Note = v.Note,
                IsCurrent = v.FileUrl == page.CurrentImageUrl
            })
            .ToListAsync();
    }

    /// <summary>
    /// Đánh giá trang (PageReview).
    /// Quyết định có thể là: approved, rejected, revision_requested, needs_revision.
    /// </summary>
    public async Task<PageReviewDto> CreatePageReview(Guid pageId, Guid reviewerId, CreatePageReviewDto dto)
    {
        var page = await _context.MangaPages
            .Include(p => p.Chapter)
                .ThenInclude(c => c.Series)
            .FirstOrDefaultAsync(p => p.PageId == pageId)
            ?? throw new KeyNotFoundException($"Trang truyện với ID {pageId} không tồn tại.");

        // Check permission: Phải là Mangaka hoặc Tantou của bộ truyện này
        if (page.Chapter.Series.MangakaId != reviewerId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền đánh giá trang truyện của bộ truyện này.");
        }

        var decision = dto.Decision.ToLower();
        if (decision == "needs_revision")
        {
            decision = "revision_requested";
        }

        var review = new PageReview
        {
            ReviewId = Guid.NewGuid(),
            PageId = pageId,
            ReviewerId = reviewerId,
            Decision = decision,
            Comment = dto.Note,
            CreatedAt = DateTime.UtcNow
        };

        _context.PageReviews.Add(review);

        // Cập nhật trạng thái trang và các task tương ứng dựa trên đánh giá
        if (decision == "approved")
        {
            page.Status = "approved";

            // Cập nhật tất cả tasks chưa hoàn thành của trang này thành approved
            var pageTasks = await _context.Tasks.Where(t => t.PageId == pageId).ToListAsync();
            foreach (var task in pageTasks)
            {
                if (task.Status != "approved")
                {
                    task.Status = "approved";
                    task.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
        else if (decision == "revision_requested" || decision == "rejected")
        {
            page.Status = "revision";

            // Cập nhật tất cả tasks đang hoạt động hoặc đã nộp thành revision
            var pageTasks = await _context.Tasks.Where(t => t.PageId == pageId).ToListAsync();
            foreach (var task in pageTasks)
            {
                if (task.Status == "submitted" || task.Status == "in_progress")
                {
                    task.Status = "revision";
                    task.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        await _context.SaveChangesAsync();

        var reviewer = await _context.Users.FindAsync(reviewerId);

        return new PageReviewDto
        {
            ReviewId = review.ReviewId,
            PageId = review.PageId,
            ReviewerId = review.ReviewerId,
            ReviewerName = reviewer?.FullName ?? "Unknown",
            Decision = review.Decision,
            Note = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }

    /// <summary>
    /// Tạo bình luận mới cho trang.
    /// </summary>
    public async Task<CommentDto> CreatePageComment(Guid pageId, Guid userId, CreateCommentDto dto)
    {
        var page = await _context.MangaPages.FindAsync(pageId)
            ?? throw new KeyNotFoundException($"Trang truyện với ID {pageId} không tồn tại.");

        var comment = new ReviewComment
        {
            CommentId = Guid.NewGuid(),
            PageId = pageId,
            UserId = userId,
            Body = dto.Body,
            CreatedAt = DateTime.UtcNow
        };

        _context.ReviewComments.Add(comment);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);

        return new CommentDto
        {
            Id = comment.CommentId,
            UserId = comment.UserId,
            UserName = user?.FullName ?? "Unknown",
            Avatar = user?.Avatar,
            Body = comment.Body,
            CreatedAt = comment.CreatedAt.ToString("O")
        };
    }
}
