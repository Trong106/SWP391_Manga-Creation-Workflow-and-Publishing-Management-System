using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class PageVersion
{
    public Guid PageVersionId { get; set; }

    public Guid PageId { get; set; }

    public int VersionNumber { get; set; }

    public string FileUrl { get; set; } = null!;

    public string FileName { get; set; } = null!;

    public long? FileSizeBytes { get; set; }

    public string? MimeType { get; set; }

    public Guid UploadedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? Note { get; set; }

    public virtual MangaPage Page { get; set; } = null!;

    public virtual ICollection<PageAnnotation> PageAnnotations { get; set; } = new List<PageAnnotation>();

    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();

    public virtual User UploadedBy { get; set; } = null!;
}
