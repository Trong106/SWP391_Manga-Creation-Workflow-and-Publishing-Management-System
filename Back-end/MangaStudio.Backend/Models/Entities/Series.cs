using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class Series
{
    public Guid SeriesId { get; set; }

    public string Title { get; set; } = null!;

    public string? TitleJp { get; set; }

    public string? Synopsis { get; set; }

    public string? CoverImageUrl { get; set; }

    public string Status { get; set; } = null!;

    public Guid MangakaId { get; set; }

    public Guid? TantouId { get; set; }

    public int? Ranking { get; set; }

    public int ReaderCount { get; set; }

    public decimal? Rating { get; set; }

    public string? CancellationReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();

    public virtual User Mangaka { get; set; } = null!;

    public virtual ICollection<ReaderVote> ReaderVotes { get; set; } = new List<ReaderVote>();

    public virtual ICollection<SeriesGenre> SeriesGenres { get; set; } = new List<SeriesGenre>();

    public virtual ICollection<SeriesProposal> SeriesProposals { get; set; } = new List<SeriesProposal>();

    public virtual User? Tantou { get; set; }
}
