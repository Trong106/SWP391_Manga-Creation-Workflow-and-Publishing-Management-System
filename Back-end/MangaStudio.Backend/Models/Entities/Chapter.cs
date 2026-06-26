using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class Chapter
{
    public Guid ChapterId { get; set; }

    public Guid SeriesId { get; set; }

    public int ChapterNumber { get; set; }

    public string Title { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateOnly? DueDate { get; set; }

    public DateTime? SubmittedForPublishingAt { get; set; }

    public string? TantouReviewNote { get; set; }

    public Guid? TantouReviewedById { get; set; }

    public DateTime? TantouReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<MangaPage> MangaPages { get; set; } = new List<MangaPage>();

    public virtual ICollection<PublishSchedule> PublishSchedules { get; set; } = new List<PublishSchedule>();

    public virtual Series Series { get; set; } = null!;

    public virtual User? TantouReviewedBy { get; set; }
}
