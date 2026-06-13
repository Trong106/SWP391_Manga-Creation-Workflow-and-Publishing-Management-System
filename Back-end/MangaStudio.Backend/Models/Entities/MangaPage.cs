using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class MangaPage
{
    public Guid PageId { get; set; }

    public Guid ChapterId { get; set; }

    public int PageNumber { get; set; }

    public string? CurrentImageUrl { get; set; }

    public string Status { get; set; } = null!;

    public Guid? UploadedById { get; set; }

    public DateTime? UploadedAt { get; set; }

    public virtual Chapter Chapter { get; set; } = null!;

    public virtual ICollection<PageAnnotation> PageAnnotations { get; set; } = new List<PageAnnotation>();

    public virtual ICollection<PageRegion> PageRegions { get; set; } = new List<PageRegion>();

    public virtual ICollection<PageReview> PageReviews { get; set; } = new List<PageReview>();

    public virtual ICollection<PageVersion> PageVersions { get; set; } = new List<PageVersion>();

    public virtual ICollection<ReviewComment> ReviewComments { get; set; } = new List<ReviewComment>();

    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();

    public virtual User? UploadedBy { get; set; }
}
