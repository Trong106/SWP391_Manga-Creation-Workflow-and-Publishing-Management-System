using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class SeriesGenre
{
    public Guid SeriesId { get; set; }

    public string Genre { get; set; } = null!;

    public virtual Series Series { get; set; } = null!;
}
