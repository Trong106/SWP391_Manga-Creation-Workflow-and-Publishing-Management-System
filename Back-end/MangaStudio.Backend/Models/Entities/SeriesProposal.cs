using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class SeriesProposal
{
    public Guid ProposalId { get; set; }

    public Guid SeriesId { get; set; }

    public Guid SubmittedById { get; set; }

    public Guid? ReviewedById { get; set; }

    public string Status { get; set; } = null!;

    public string? ProposalSynopsis { get; set; }

    public string? ReviewNote { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public virtual User? ReviewedBy { get; set; }

    public virtual ICollection<ProposalBoardVote> ProposalBoardVotes { get; set; } = new List<ProposalBoardVote>();

    public virtual Series Series { get; set; } = null!;

    public virtual User SubmittedBy { get; set; } = null!;
}
