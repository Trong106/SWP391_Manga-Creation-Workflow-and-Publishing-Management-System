using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.Entities;

public partial class User
{
    public Guid UserId { get; set; }

    public int RoleId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? PasswordHash { get; set; }

    public string? Avatar { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual AssistantProfile? AssistantProfile { get; set; }

    public virtual ICollection<MangaPage> MangaPages { get; set; } = new List<MangaPage>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<PageAnnotation> PageAnnotations { get; set; } = new List<PageAnnotation>();

    public virtual ICollection<PageRegion> PageRegions { get; set; } = new List<PageRegion>();

    public virtual ICollection<PageReview> PageReviews { get; set; } = new List<PageReview>();

    public virtual ICollection<PageVersion> PageVersions { get; set; } = new List<PageVersion>();

    public virtual ICollection<PayrollRecord> PayrollRecords { get; set; } = new List<PayrollRecord>();

    public virtual ICollection<PublishSchedule> PublishSchedules { get; set; } = new List<PublishSchedule>();

    public virtual ICollection<ReviewComment> ReviewComments { get; set; } = new List<ReviewComment>();

    public virtual Role Role { get; set; } = null!;

    public virtual ICollection<Series> SeriesMangakas { get; set; } = new List<Series>();

    public virtual ICollection<SeriesProposal> SeriesProposalReviewedBies { get; set; } = new List<SeriesProposal>();

    public virtual ICollection<SeriesProposal> SeriesProposalSubmittedBies { get; set; } = new List<SeriesProposal>();

    public virtual ICollection<Series> SeriesTantous { get; set; } = new List<Series>();

    public virtual ICollection<Task> TaskAssignees { get; set; } = new List<Task>();

    public virtual ICollection<Task> TaskAssigners { get; set; } = new List<Task>();

    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();
}
