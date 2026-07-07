using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace MangaStudio.Backend.Models.Entities;

public partial class MangaStudioContext : DbContext
{
    public MangaStudioContext()
    {
    }

    public MangaStudioContext(DbContextOptions options)
        : base(options)
    {
    }

    public virtual DbSet<AssistantProfile> AssistantProfiles { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Chapter> Chapters { get; set; }

    public virtual DbSet<MangaPage> MangaPages { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<PageAnnotation> PageAnnotations { get; set; }

    public virtual DbSet<PageRegion> PageRegions { get; set; }

    public virtual DbSet<PageReview> PageReviews { get; set; }

    public virtual DbSet<PageVersion> PageVersions { get; set; }

    public virtual DbSet<PayrollRecord> PayrollRecords { get; set; }

    public virtual DbSet<PublishSchedule> PublishSchedules { get; set; }

    public virtual DbSet<ReaderVote> ReaderVotes { get; set; }

    public virtual DbSet<ReviewComment> ReviewComments { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Series> Series { get; set; }

    public virtual DbSet<SeriesGenre> SeriesGenres { get; set; }

    public virtual DbSet<SeriesProposal> SeriesProposals { get; set; }

    public virtual DbSet<Task> Tasks { get; set; }

    public virtual DbSet<TaskSubmission> TaskSubmissions { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnection");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AssistantProfile>(entity =>
        {
            entity.HasKey(e => e.AssistantId);

            entity.Property(e => e.AssistantId).ValueGeneratedNever();
            entity.Property(e => e.HourlyRate).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Rating).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.Specialty).HasMaxLength(120);

            entity.HasOne(d => d.Assistant).WithOne(p => p.AssistantProfile)
                .HasForeignKey<AssistantProfile>(d => d.AssistantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AssistantProfiles_Users");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasIndex(e => new { e.EntityType, e.EntityId, e.CreatedAt }, "IX_AuditLogs_Entity").IsDescending(false, false, true);

            entity.Property(e => e.AuditLogId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Action).HasMaxLength(120);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.EntityType).HasMaxLength(120);

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_AuditLogs_User");
        });

        modelBuilder.Entity<Chapter>(entity =>
        {
            entity.HasIndex(e => new { e.SeriesId, e.Status }, "IX_Chapters_SeriesId_Status");

            entity.HasIndex(e => new { e.SeriesId, e.ChapterNumber }, "UQ_Chapters_Series_Number").IsUnique();

            entity.Property(e => e.ChapterId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("draft");
            entity.Property(e => e.SubmittedForPublishingAt).HasPrecision(0);
            entity.Property(e => e.TantouReviewedAt).HasPrecision(0);
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Series).WithMany(p => p.Chapters)
                .HasForeignKey(d => d.SeriesId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Chapters_Series");

            entity.HasOne(d => d.TantouReviewedBy).WithMany()
                .HasForeignKey(d => d.TantouReviewedById)
                .HasConstraintName("FK_Chapters_TantouReviewedBy");
        });

        modelBuilder.Entity<MangaPage>(entity =>
        {
            entity.HasKey(e => e.PageId);

            entity.HasIndex(e => new { e.ChapterId, e.Status }, "IX_MangaPages_ChapterId_Status");

            entity.HasIndex(e => new { e.ChapterId, e.PageNumber }, "UQ_MangaPages_Chapter_PageNumber").IsUnique();

            entity.Property(e => e.PageId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CurrentImageUrl).HasMaxLength(1000);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("pending");
            entity.Property(e => e.UploadedAt).HasPrecision(0);

            entity.HasOne(d => d.Chapter).WithMany(p => p.MangaPages)
                .HasForeignKey(d => d.ChapterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MangaPages_Chapters");

            entity.HasOne(d => d.UploadedBy).WithMany(p => p.MangaPages)
                .HasForeignKey(d => d.UploadedById)
                .HasConstraintName("FK_MangaPages_UploadedBy");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt }, "IX_Notifications_UserId_IsRead").IsDescending(false, false, true);

            entity.Property(e => e.NotificationId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Link).HasMaxLength(1000);
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.Type)
                .HasMaxLength(40)
                .IsUnicode(false);

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notifications_User");
        });

        modelBuilder.Entity<PageAnnotation>(entity =>
        {
            entity.HasKey(e => e.AnnotationId);

            entity.Property(e => e.AnnotationId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Height).HasColumnType("decimal(9, 2)");
            entity.Property(e => e.ResolvedAt).HasPrecision(0);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("open");
            entity.Property(e => e.Width).HasColumnType("decimal(9, 2)");
            entity.Property(e => e.X).HasColumnType("decimal(9, 2)");
            entity.Property(e => e.Y).HasColumnType("decimal(9, 2)");

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.PageAnnotations)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PageAnnotations_CreatedBy");

            entity.HasOne(d => d.Page).WithMany(p => p.PageAnnotations)
                .HasForeignKey(d => d.PageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PageAnnotations_Page");

            entity.HasOne(d => d.PageVersion).WithMany(p => p.PageAnnotations)
                .HasForeignKey(d => d.PageVersionId)
                .HasConstraintName("FK_PageAnnotations_PageVersion");
        });

        modelBuilder.Entity<PageRegion>(entity =>
        {
            entity.HasKey(e => e.RegionId);

            entity.HasIndex(e => new { e.PageId, e.Status }, "IX_PageRegions_PageId_Status");

            entity.Property(e => e.RegionId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Height).HasColumnType("decimal(9, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("pending");
            entity.Property(e => e.Type)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.Width).HasColumnType("decimal(9, 2)");
            entity.Property(e => e.X).HasColumnType("decimal(9, 2)");
            entity.Property(e => e.Y).HasColumnType("decimal(9, 2)");

            entity.HasOne(d => d.AssignedTo).WithMany(p => p.PageRegions)
                .HasForeignKey(d => d.AssignedToId)
                .HasConstraintName("FK_PageRegions_AssignedTo");

            entity.HasOne(d => d.Page).WithMany(p => p.PageRegions)
                .HasForeignKey(d => d.PageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PageRegions_Page");
        });

        modelBuilder.Entity<PageReview>(entity =>
        {
            entity.HasKey(e => e.ReviewId);

            entity.Property(e => e.ReviewId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Decision)
                .HasMaxLength(30)
                .IsUnicode(false);

            entity.HasOne(d => d.Page).WithMany(p => p.PageReviews)
                .HasForeignKey(d => d.PageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PageReviews_Page");

            entity.HasOne(d => d.Reviewer).WithMany(p => p.PageReviews)
                .HasForeignKey(d => d.ReviewerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PageReviews_Reviewer");
        });

        modelBuilder.Entity<PageVersion>(entity =>
        {
            entity.HasIndex(e => new { e.PageId, e.VersionNumber }, "UQ_PageVersions_Page_Version").IsUnique();

            entity.Property(e => e.PageVersionId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.FileName).HasMaxLength(255);
            entity.Property(e => e.FileUrl).HasMaxLength(1000);
            entity.Property(e => e.MimeType).HasMaxLength(120);
            entity.Property(e => e.Note).HasMaxLength(1000);

            entity.HasOne(d => d.Page).WithMany(p => p.PageVersions)
                .HasForeignKey(d => d.PageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PageVersions_Page");

            entity.HasOne(d => d.UploadedBy).WithMany(p => p.PageVersions)
                .HasForeignKey(d => d.UploadedById)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PageVersions_UploadedBy");
        });

        modelBuilder.Entity<PayrollRecord>(entity =>
        {
            entity.HasIndex(e => new { e.AssistantId, e.Status }, "IX_PayrollRecords_AssistantId_Status");

            entity.Property(e => e.PayrollRecordId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.BaseAmount).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.BonusAmount).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DeductionAmount).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.PaidAt).HasPrecision(0);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("pending");
            entity.Property(e => e.TotalAmount)
                .HasComputedColumnSql("(([BaseAmount]+[BonusAmount])-[DeductionAmount])", true)
                .HasColumnType("decimal(14, 2)");

            entity.HasOne(d => d.Assistant).WithMany(p => p.PayrollRecords)
                .HasForeignKey(d => d.AssistantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PayrollRecords_Assistant");

            entity.HasOne(d => d.Task).WithMany(p => p.PayrollRecords)
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("FK_PayrollRecords_Task");
        });

        modelBuilder.Entity<PublishSchedule>(entity =>
        {
            entity.Property(e => e.PublishScheduleId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.PublishedAt).HasPrecision(0);
            entity.Property(e => e.ScheduledDate).HasPrecision(0);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("scheduled");

            entity.HasOne(d => d.ApprovedBy).WithMany(p => p.PublishSchedules)
                .HasForeignKey(d => d.ApprovedById)
                .HasConstraintName("FK_PublishSchedules_ApprovedBy");

            entity.HasOne(d => d.Chapter).WithMany(p => p.PublishSchedules)
                .HasForeignKey(d => d.ChapterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PublishSchedules_Chapter");
        });

        modelBuilder.Entity<ReaderVote>(entity =>
        {
            entity.HasIndex(e => new { e.YearNumber, e.WeekNumber, e.RankNumber }, "IX_ReaderVotes_Week_Rank");

            entity.HasIndex(e => new { e.SeriesId, e.WeekNumber, e.YearNumber }, "UQ_ReaderVotes_Series_Week").IsUnique();

            entity.Property(e => e.ReaderVoteId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Series).WithMany(p => p.ReaderVotes)
                .HasForeignKey(d => d.SeriesId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReaderVotes_Series");
        });

        modelBuilder.Entity<ReviewComment>(entity =>
        {
            entity.HasKey(e => e.CommentId);

            entity.Property(e => e.CommentId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Page).WithMany(p => p.ReviewComments)
                .HasForeignKey(d => d.PageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReviewComments_Page");

            entity.HasOne(d => d.User).WithMany(p => p.ReviewComments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReviewComments_User");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(e => e.Code, "UQ_Roles_Code").IsUnique();

            entity.Property(e => e.Code)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.Name).HasMaxLength(80);
        });

        modelBuilder.Entity<Series>(entity =>
        {
            entity.HasIndex(e => e.MangakaId, "IX_Series_MangakaId");

            entity.HasIndex(e => new { e.Status, e.Ranking }, "IX_Series_Status_Ranking");

            entity.HasIndex(e => e.TantouId, "IX_Series_TantouId");

            entity.Property(e => e.SeriesId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CancellationReason).HasMaxLength(1000);
            entity.Property(e => e.CoverImageUrl).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Rating).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("proposal");
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.TitleJp).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Mangaka).WithMany(p => p.SeriesMangakas)
                .HasForeignKey(d => d.MangakaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Series_Mangaka");

            entity.HasOne(d => d.Tantou).WithMany(p => p.SeriesTantous)
                .HasForeignKey(d => d.TantouId)
                .HasConstraintName("FK_Series_Tantou");
        });

        modelBuilder.Entity<SeriesGenre>(entity =>
        {
            entity.HasKey(e => new { e.SeriesId, e.Genre });

            entity.Property(e => e.Genre).HasMaxLength(80);

            entity.HasOne(d => d.Series).WithMany(p => p.SeriesGenres)
                .HasForeignKey(d => d.SeriesId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SeriesGenres_Series");
        });

        modelBuilder.Entity<SeriesProposal>(entity =>
        {
            entity.HasKey(e => e.ProposalId);

            entity.Property(e => e.ProposalId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ReviewedAt).HasPrecision(0);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("submitted");
            entity.Property(e => e.SubmittedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.ReviewedBy).WithMany(p => p.SeriesProposalReviewedBies)
                .HasForeignKey(d => d.ReviewedById)
                .HasConstraintName("FK_SeriesProposals_ReviewedBy");

            entity.HasOne(d => d.Series).WithMany(p => p.SeriesProposals)
                .HasForeignKey(d => d.SeriesId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SeriesProposals_Series");

            entity.HasOne(d => d.SubmittedBy).WithMany(p => p.SeriesProposalSubmittedBies)
                .HasForeignKey(d => d.SubmittedById)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SeriesProposals_SubmittedBy");
        });

        modelBuilder.Entity<Task>(entity =>
        {
            entity.HasIndex(e => new { e.AssigneeId, e.Status }, "IX_Tasks_AssigneeId_Status");

            entity.HasIndex(e => e.PageId, "IX_Tasks_PageId");

            entity.Property(e => e.TaskId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.PaymentAmount).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("pending");
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.Type)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Assignee).WithMany(p => p.TaskAssignees)
                .HasForeignKey(d => d.AssigneeId)
                .HasConstraintName("FK_Tasks_Assignee");

            entity.HasOne(d => d.Assigner).WithMany(p => p.TaskAssigners)
                .HasForeignKey(d => d.AssignerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tasks_Assigner");

            entity.HasOne(d => d.Page).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.PageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tasks_Page");

            entity.HasOne(d => d.Region).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.RegionId)
                .HasConstraintName("FK_Tasks_Region");
        });

        modelBuilder.Entity<TaskSubmission>(entity =>
        {
            entity.HasKey(e => e.SubmissionId);

            entity.Property(e => e.SubmissionId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("submitted");
            entity.Property(e => e.SubmittedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.PageVersion).WithMany(p => p.TaskSubmissions)
                .HasForeignKey(d => d.PageVersionId)
                .HasConstraintName("FK_TaskSubmissions_PageVersion");

            entity.HasOne(d => d.SubmittedBy).WithMany(p => p.TaskSubmissions)
                .HasForeignKey(d => d.SubmittedById)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TaskSubmissions_SubmittedBy");

            entity.HasOne(d => d.Task).WithMany(p => p.TaskSubmissions)
                .HasForeignKey(d => d.TaskId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TaskSubmissions_Task");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.RoleId, "IX_Users_RoleId");

            entity.HasIndex(e => e.Email, "UQ_Users_Email").IsUnique();

            entity.Property(e => e.UserId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Avatar).HasMaxLength(255);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FullName).HasMaxLength(160);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Users_Roles");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
