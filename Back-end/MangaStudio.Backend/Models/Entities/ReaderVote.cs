using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class ReaderVote
{
    public Guid ReaderVoteId { get; set; }

    public Guid SeriesId { get; set; }

    public int WeekNumber { get; set; }

    public int YearNumber { get; set; }

    public int Votes { get; set; }

    public int RankNumber { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Series Series { get; set; } = null!;
}
