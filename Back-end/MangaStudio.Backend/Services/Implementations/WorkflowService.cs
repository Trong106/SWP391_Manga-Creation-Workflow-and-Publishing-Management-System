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

    /// <summary>
    /// Lấy danh sách đề xuất chờ duyệt (status = 'submitted').
    /// </summary>
    public async Task<List<ProposalDto>> GetPendingProposals()
    {
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
        }
        else if (decision == "rejected")
        {
            proposal.Series.Status = "proposal"; // Revert/Keep proposal
        }

        proposal.Series.UpdatedAt = DateTime.UtcNow;

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

        schedule.ApprovedById = editorialId;
        schedule.Status = "published";
        schedule.PublishedAt = DateTime.UtcNow;
        if (schedule.Chapter != null)
        {
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
        
        await _context.SaveChangesAsync();

        return await GetPublishScheduleById(schedule.PublishScheduleId);
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
            .AsQueryable();

        if (assistantId.HasValue)
        {
            query = query.Where(p => p.AssistantId == assistantId.Value);
        }

        if (mangakaId.HasValue)
        {
            query = query.Where(p => p.Task != null && p.Task.AssignerId == mangakaId.Value);
        }

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PayrollDto
            {
                PayrollRecordId = p.PayrollRecordId,
                AssistantId = p.AssistantId,
                AssistantName = p.Assistant.FullName,
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
            .ToListAsync();
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
            SeriesSynopsis = p.Series?.Synopsis,
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
