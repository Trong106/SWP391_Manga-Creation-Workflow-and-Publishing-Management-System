using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MangaStudio.Backend.Models.DTOs;

/// <summary>DTO hiển thị đề xuất bộ truyện.</summary>
public class ProposalDto
{
    public Guid ProposalId { get; set; }
    public Guid SeriesId { get; set; }
    public string SeriesTitle { get; set; } = null!;
    public string? SeriesSynopsis { get; set; }
    public List<string> SeriesGenres { get; set; } = new();
    public Guid SubmittedById { get; set; }
    public string SubmittedByName { get; set; } = null!;
    public Guid? ReviewedById { get; set; }
    public string? ReviewedByName { get; set; }
    public string Status { get; set; } = null!;
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? CoverImageUrl { get; set; }
    public int? Ranking { get; set; }
    public int ReaderCount { get; set; }
    public decimal? Rating { get; set; }
}

/// <summary>DTO duyệt hoặc từ chối đề xuất bộ truyện.</summary>
public class ReviewProposalDto
{
    [Required(ErrorMessage = "Review decision is required.")]
    [RegularExpression("^(approved|rejected)$", ErrorMessage = "Decision must be approved or rejected.")]
    public string Decision { get; set; } = null!;

    public string? Feedback { get; set; }

    public Guid? TantouId { get; set; }
}

public class ReviewChapterDto
{
    [Required(ErrorMessage = "Chapter review decision is required.")]
    [RegularExpression("^(approved|revision_requested|rejected)$",
        ErrorMessage = "Decision must be approved, revision_requested, or rejected.")]
    public string Decision { get; set; } = null!;

    public string? Note { get; set; }
}

public class UserOptionDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
}

/// <summary>DTO hiển thị lịch xuất bản.</summary>
public class PublishScheduleDto
{
    public Guid ScheduleId { get; set; }
    public Guid ChapterId { get; set; }
    public int ChapterNumber { get; set; }
    public string? ChapterTitle { get; set; }
    public string SeriesTitle { get; set; } = null!;
    public DateTime ScheduledDate { get; set; }
    public string Status { get; set; } = null!;
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? AuthorName { get; set; }
    public decimal? Rating { get; set; }
    public int ReaderCount { get; set; }
    public string? ChapterStatus { get; set; }
}

/// <summary>DTO tạo lịch xuất bản.</summary>
public class CreatePublishScheduleDto
{
    [Required(ErrorMessage = "Scheduled date is required.")]
    public DateTime ScheduledDate { get; set; }
}

/// <summary>DTO hiển thị thông tin bảng lương trợ lý.</summary>
public class PayrollDto
{
    public Guid PayrollRecordId { get; set; }
    public Guid AssistantId { get; set; }
    public string AssistantName { get; set; } = null!;
    public Guid? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public string? TaskType { get; set; }
    public string? SeriesTitle { get; set; }
    public int? ChapterNumber { get; set; }
    public string? ChapterTitle { get; set; }
    public int? PageNumber { get; set; }
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }
    public decimal BaseAmount { get; set; }
    public decimal BonusAmount { get; set; }
    public decimal DeductionAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? PaidAt { get; set; }
    public string? PaymentReference { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>DTO hiển thị thông báo.</summary>
public class NotificationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public bool IsRead { get; set; }
    public string? Link { get; set; }
    public DateTime CreatedAt { get; set; }
}
