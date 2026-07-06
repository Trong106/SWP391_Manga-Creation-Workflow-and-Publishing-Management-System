using System;
using System.ComponentModel.DataAnnotations;

namespace MangaStudio.Backend.Models.DTOs;

/// <summary>DTO hiển thị ghi chú annotation trên trang.</summary>
public class AnnotationDto
{
    public Guid AnnotationId { get; set; }
    public Guid PageId { get; set; }
    public Guid CreatedById { get; set; }
    public string CreatedByName { get; set; } = null!;
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public string Body { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

/// <summary>DTO tạo annotation mới trên trang.</summary>
public class CreateAnnotationDto
{
    [Required(ErrorMessage = "X coordinate is required.")]
    [Range(0, 99999, ErrorMessage = "X coordinate must be valid.")]
    public decimal X { get; set; }

    [Required(ErrorMessage = "Y coordinate is required.")]
    [Range(0, 99999, ErrorMessage = "Y coordinate must be valid.")]
    public decimal Y { get; set; }

    [Range(0, 99999)]
    public decimal? Width { get; set; }

    [Range(0, 99999)]
    public decimal? Height { get; set; }

    [Required(ErrorMessage = "Annotation content is required.")]
    public string Body { get; set; } = null!;
}

/// <summary>DTO hiển thị nhận xét review (PageReview).</summary>
public class PageReviewDto
{
    public Guid ReviewId { get; set; }
    public Guid PageId { get; set; }
    public Guid ReviewerId { get; set; }
    public string ReviewerName { get; set; } = null!;
    public string Decision { get; set; } = null!;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>DTO tạo nhận xét review trang.</summary>
public class CreatePageReviewDto
{
    [Required(ErrorMessage = "Review decision is required.")]
    [RegularExpression("^(approved|rejected|revision_requested|needs_revision)$",
        ErrorMessage = "Decision must be approved, rejected, revision_requested, or needs_revision.")]
    public string Decision { get; set; } = null!;

    public string? Note { get; set; }
}
