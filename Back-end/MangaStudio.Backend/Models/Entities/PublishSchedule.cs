using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class PublishSchedule
{
    public Guid PublishScheduleId { get; set; }

    public Guid ChapterId { get; set; }

    public DateTime ScheduledDate { get; set; }

    public string Status { get; set; } = null!;

    public Guid? ApprovedById { get; set; }

    public DateTime? PublishedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? ApprovedBy { get; set; }

    public virtual Chapter Chapter { get; set; } = null!;
}
