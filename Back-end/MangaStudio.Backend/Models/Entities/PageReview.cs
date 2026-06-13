using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class PageReview
{
    public Guid ReviewId { get; set; }

    public Guid PageId { get; set; }

    public Guid ReviewerId { get; set; }

    public string Decision { get; set; } = null!;

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual MangaPage Page { get; set; } = null!;

    public virtual User Reviewer { get; set; } = null!;
}
