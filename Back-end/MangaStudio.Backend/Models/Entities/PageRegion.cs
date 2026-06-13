using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class PageRegion
{
    public Guid RegionId { get; set; }

    public Guid PageId { get; set; }

    public string Type { get; set; } = null!;

    public decimal X { get; set; }

    public decimal Y { get; set; }

    public decimal Width { get; set; }

    public decimal Height { get; set; }

    public Guid? AssignedToId { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual User? AssignedTo { get; set; }

    public virtual MangaPage Page { get; set; } = null!;

    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
}
