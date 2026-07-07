using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class PageAnnotation
{
    public Guid AnnotationId { get; set; }

    public Guid PageId { get; set; }

    public Guid? PageVersionId { get; set; }

    public Guid CreatedById { get; set; }

    public decimal X { get; set; }

    public decimal Y { get; set; }

    public decimal? Width { get; set; }

    public decimal? Height { get; set; }

    public string Body { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public virtual User CreatedBy { get; set; } = null!;

    public virtual MangaPage Page { get; set; } = null!;

    public virtual PageVersion? PageVersion { get; set; }
}
