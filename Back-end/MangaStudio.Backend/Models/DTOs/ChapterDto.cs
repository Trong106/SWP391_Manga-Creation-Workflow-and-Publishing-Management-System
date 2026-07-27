using System.ComponentModel.DataAnnotations;

namespace MangaStudio.Backend.Models.DTOs;


public class ChapterDto
{
    public Guid ChapterId { get; set; }
    public Guid SeriesId { get; set; }
    public string SeriesTitle { get; set; } = null!;
    public int ChapterNumber { get; set; }
    public string? Title { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? DueDate { get; set; }
    public DateTime? SubmittedForPublishingAt { get; set; }
    public string? TantouReviewNote { get; set; }
    public Guid? TantouReviewedById { get; set; }
    public string? TantouReviewedByName { get; set; }
    public DateTime? TantouReviewedAt { get; set; }
    public int PageCount { get; set; }
    public int ApprovedPageCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}


public class CreateChapterDto
{
    [Required(ErrorMessage = "Chapter number is required.")]
    [Range(1, 9999, ErrorMessage = "Chapter number must be between 1 and 9999.")]
    public int ChapterNumber { get; set; }

    [StringLength(255)]
    public string? Title { get; set; }

    public DateTime? DueDate { get; set; }
}


public class UpdateChapterDto
{
    [StringLength(255)]
    public string? Title { get; set; }

    public DateTime? DueDate { get; set; }
    public string? Status { get; set; }
}
