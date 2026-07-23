using System;

namespace MangaStudio.Backend.Models.Entities;

public partial class ProposalBoardVote
{
    public Guid VoteSessionId { get; set; }

    public Guid ProposalId { get; set; }

    public int BoardSize { get; set; }

    public int ApproveVotes { get; set; }

    public int RejectVotes { get; set; }

    public int AbstainVotes { get; set; }

    public int RequiredApproveVotes { get; set; }

    public string Decision { get; set; } = null!;

    public string? MeetingNote { get; set; }

    public Guid RecordedById { get; set; }

    public DateTime RecordedAt { get; set; }

    public virtual SeriesProposal Proposal { get; set; } = null!;

    public virtual User RecordedBy { get; set; } = null!;
}
