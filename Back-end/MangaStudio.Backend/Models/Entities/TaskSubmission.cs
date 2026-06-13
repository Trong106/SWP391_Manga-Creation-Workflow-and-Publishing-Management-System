using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class TaskSubmission
{
    public Guid SubmissionId { get; set; }

    public Guid TaskId { get; set; }

    public Guid SubmittedById { get; set; }

    public Guid? PageVersionId { get; set; }

    public string? Note { get; set; }

    public string Status { get; set; } = null!;

    public DateTime SubmittedAt { get; set; }

    public virtual PageVersion? PageVersion { get; set; }

    public virtual User SubmittedBy { get; set; } = null!;

    public virtual Task Task { get; set; } = null!;
}
