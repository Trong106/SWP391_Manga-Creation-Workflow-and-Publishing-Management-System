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
""");
    }
}
