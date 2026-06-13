using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class AuditLog
{
    public Guid AuditLogId { get; set; }

    public Guid? UserId { get; set; }

    public string Action { get; set; } = null!;

    public string EntityType { get; set; } = null!;

    public Guid? EntityId { get; set; }

    public string? DetailsJson { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? User { get; set; }
}
