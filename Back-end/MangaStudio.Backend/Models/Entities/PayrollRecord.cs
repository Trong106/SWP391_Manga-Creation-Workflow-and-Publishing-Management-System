using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class PayrollRecord
{
    public Guid PayrollRecordId { get; set; }

    public Guid AssistantId { get; set; }

    public Guid? TaskId { get; set; }

    public DateOnly PeriodStart { get; set; }

    public DateOnly PeriodEnd { get; set; }

    public decimal BaseAmount { get; set; }

    public decimal BonusAmount { get; set; }

    public decimal DeductionAmount { get; set; }

    public decimal? TotalAmount { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User Assistant { get; set; } = null!;

    public virtual Task? Task { get; set; }
}
