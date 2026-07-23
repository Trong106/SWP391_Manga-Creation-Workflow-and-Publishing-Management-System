using Microsoft.EntityFrameworkCore;

namespace MangaStudio.Backend.Data;

public static class DatabaseSchemaInitializer
{
    public static async Task EnsureCompatibleSchemaAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await context.Database.ExecuteSqlRawAsync("""
IF OBJECT_ID(N'dbo.PageAnnotations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PageAnnotations', N'PageVersionId') IS NULL
BEGIN
    ALTER TABLE dbo.PageAnnotations ADD PageVersionId UNIQUEIDENTIFIER NULL;
END;

IF OBJECT_ID(N'dbo.TaskSubmissions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TaskSubmissions', N'PageVersionId') IS NULL
BEGIN
    ALTER TABLE dbo.TaskSubmissions ADD PageVersionId UNIQUEIDENTIFIER NULL;
END;

IF OBJECT_ID(N'dbo.Tasks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Tasks', N'ApprovedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Tasks ADD ApprovedAt DATETIME2(0) NULL;
END;

IF OBJECT_ID(N'dbo.SeriesProposals', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SeriesProposals', N'ProposalSynopsis') IS NULL
BEGIN
    ALTER TABLE dbo.SeriesProposals ADD ProposalSynopsis NVARCHAR(MAX) NULL;
END;

IF OBJECT_ID(N'dbo.SeriesProposals', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Series', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SeriesProposals', N'ProposalSynopsis') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        UPDATE proposal
        SET ProposalSynopsis = series.Synopsis
        FROM dbo.SeriesProposals proposal
        INNER JOIN dbo.Series series ON series.SeriesId = proposal.SeriesId
        WHERE proposal.ProposalSynopsis IS NULL;
    ';
END;

IF OBJECT_ID(N'dbo.PageAnnotations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PageVersions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PageAnnotations', N'PageVersionId') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PageAnnotations_PageVersion')
BEGIN
    ALTER TABLE dbo.PageAnnotations WITH NOCHECK
    ADD CONSTRAINT FK_PageAnnotations_PageVersion
    FOREIGN KEY (PageVersionId) REFERENCES dbo.PageVersions(PageVersionId);
END;

IF OBJECT_ID(N'dbo.TaskSubmissions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PageVersions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TaskSubmissions', N'PageVersionId') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaskSubmissions_PageVersion')
BEGIN
    ALTER TABLE dbo.TaskSubmissions WITH NOCHECK
    ADD CONSTRAINT FK_TaskSubmissions_PageVersion
    FOREIGN KEY (PageVersionId) REFERENCES dbo.PageVersions(PageVersionId);
END;

IF OBJECT_ID(N'dbo.Chapters', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Chapters_Status')
BEGIN
    ALTER TABLE dbo.Chapters DROP CONSTRAINT CK_Chapters_Status;
END;

IF OBJECT_ID(N'dbo.Chapters', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Chapters_Status')
BEGIN
    ALTER TABLE dbo.Chapters WITH CHECK
    ADD CONSTRAINT CK_Chapters_Status
    CHECK ([Status] IN (
        'draft',
        'in_progress',
        'review',
        'approved',
        'tantou_review',
        'revision',
        'revision_requested',
        'editorial_ready',
        'scheduled',
        'published',
        'cancelled'
    ));
END;

IF OBJECT_ID(N'dbo.Notifications', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Notifications_Type')
BEGIN
    ALTER TABLE dbo.Notifications DROP CONSTRAINT CK_Notifications_Type;
END;

IF OBJECT_ID(N'dbo.Notifications', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Notifications_Type')
BEGIN
    ALTER TABLE dbo.Notifications WITH CHECK
    ADD CONSTRAINT CK_Notifications_Type
    CHECK ([Type] IN (
        'task_assigned',
        'task_submitted',
        'review_needed',
        'payment',
        'deadline',
        'reader_vote_risk',
        'system'
    ));
END;
""");
    }
}
