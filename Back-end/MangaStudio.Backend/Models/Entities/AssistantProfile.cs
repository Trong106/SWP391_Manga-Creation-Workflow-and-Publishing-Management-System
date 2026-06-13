using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class AssistantProfile
{
    public Guid AssistantId { get; set; }

    public string? Specialty { get; set; }

    public decimal HourlyRate { get; set; }

    public decimal? Rating { get; set; }

    public virtual User Assistant { get; set; } = null!;
}
