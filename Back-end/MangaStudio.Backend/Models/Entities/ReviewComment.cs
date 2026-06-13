using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class ReviewComment
{
    public Guid CommentId { get; set; }

    public Guid PageId { get; set; }

    public Guid UserId { get; set; }

    public string Body { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual MangaPage Page { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
