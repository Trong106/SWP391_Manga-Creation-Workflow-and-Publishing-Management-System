using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class Task
{
    public Guid TaskId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string Type { get; set; } = null!;

    public Guid PageId { get; set; }

    public Guid? RegionId { get; set; }

    public Guid? AssigneeId { get; set; }

    public Guid AssignerId { get; set; }

    public string Status { get; set; } = null!;

    public DateOnly? DueDate { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public decimal PaymentAmount { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual User? Assignee { get; set; }

    public virtual User Assigner { get; set; } = null!;

    public virtual MangaPage Page { get; set; } = null!;

    public virtual ICollection<PayrollRecord> PayrollRecords { get; set; } = new List<PayrollRecord>();

    public virtual PageRegion? Region { get; set; }

    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();
}
