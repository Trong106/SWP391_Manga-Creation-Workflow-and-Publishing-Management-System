SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF DB_ID(N'MangaStudioWorkflow') IS NULL
BEGIN
    CREATE DATABASE MangaStudioWorkflow;
END
GO

USE MangaStudioWorkflow;
GO

DROP TABLE IF EXISTS dbo.AuditLogs;
DROP TABLE IF EXISTS dbo.ReaderVotes;
DROP TABLE IF EXISTS dbo.PublishSchedules;
DROP TABLE IF EXISTS dbo.PayrollRecords;
DROP TABLE IF EXISTS dbo.Notifications;
DROP TABLE IF EXISTS dbo.PageAnnotations;
DROP TABLE IF EXISTS dbo.ReviewComments;
DROP TABLE IF EXISTS dbo.PageReviews;
DROP TABLE IF EXISTS dbo.TaskSubmissions;
DROP TABLE IF EXISTS dbo.Tasks;
DROP TABLE IF EXISTS dbo.PageRegions;
DROP TABLE IF EXISTS dbo.PageVersions;
DROP TABLE IF EXISTS dbo.MangaPages;
DROP TABLE IF EXISTS dbo.Chapters;
DROP TABLE IF EXISTS dbo.SeriesProposals;
DROP TABLE IF EXISTS dbo.SeriesGenres;
DROP TABLE IF EXISTS dbo.Series;
DROP TABLE IF EXISTS dbo.AssistantProfiles;
DROP TABLE IF EXISTS dbo.Users;
DROP TABLE IF EXISTS dbo.Roles;
GO

CREATE TABLE dbo.Roles
(
    RoleId          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
    Code            VARCHAR(30) NOT NULL CONSTRAINT UQ_Roles_Code UNIQUE,
    Name            NVARCHAR(80) NOT NULL
);

CREATE TABLE dbo.Users
(
    UserId          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Users PRIMARY KEY DEFAULT NEWID(),
    RoleId          INT NOT NULL,
    FullName        NVARCHAR(160) NOT NULL,
    Email           NVARCHAR(255) NOT NULL,
    PasswordHash    NVARCHAR(500) NULL,
    Avatar          NVARCHAR(255) NULL,
    IsActive        BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(RoleId)
);

CREATE TABLE dbo.AssistantProfiles
(
    AssistantId     UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AssistantProfiles PRIMARY KEY,
    Specialty       NVARCHAR(120) NULL,
    HourlyRate      DECIMAL(12,2) NOT NULL CONSTRAINT DF_AssistantProfiles_HourlyRate DEFAULT 0,
    Rating          DECIMAL(3,2) NULL,
    CONSTRAINT FK_AssistantProfiles_Users FOREIGN KEY (AssistantId) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.Series
(
    SeriesId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Series PRIMARY KEY DEFAULT NEWID(),
    Title           NVARCHAR(255) NOT NULL,
    TitleJp         NVARCHAR(255) NULL,
    Synopsis        NVARCHAR(MAX) NULL,
    CoverImageUrl   NVARCHAR(1000) NULL,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_Series_Status DEFAULT 'proposal',
    MangakaId       UNIQUEIDENTIFIER NOT NULL,
    TantouId        UNIQUEIDENTIFIER NULL,
    Ranking         INT NULL,
    ReaderCount     INT NOT NULL CONSTRAINT DF_Series_ReaderCount DEFAULT 0,
    Rating          DECIMAL(3,2) NULL,
    CancellationReason NVARCHAR(1000) NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Series_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Series_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Series_Status CHECK (Status IN ('proposal','active','hiatus','completed','cancelled')),
    CONSTRAINT FK_Series_Mangaka FOREIGN KEY (MangakaId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Series_Tantou FOREIGN KEY (TantouId) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.SeriesGenres
(
    SeriesId        UNIQUEIDENTIFIER NOT NULL,
    Genre           NVARCHAR(80) NOT NULL,
    CONSTRAINT PK_SeriesGenres PRIMARY KEY (SeriesId, Genre),
    CONSTRAINT FK_SeriesGenres_Series FOREIGN KEY (SeriesId) REFERENCES dbo.Series(SeriesId)
);

CREATE TABLE dbo.SeriesProposals
(
    ProposalId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SeriesProposals PRIMARY KEY DEFAULT NEWID(),
    SeriesId        UNIQUEIDENTIFIER NOT NULL,
    SubmittedById   UNIQUEIDENTIFIER NOT NULL,
    ReviewedById    UNIQUEIDENTIFIER NULL,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_SeriesProposals_Status DEFAULT 'submitted',
    ReviewNote      NVARCHAR(MAX) NULL,
    SubmittedAt     DATETIME2(0) NOT NULL CONSTRAINT DF_SeriesProposals_SubmittedAt DEFAULT SYSUTCDATETIME(),
    ReviewedAt      DATETIME2(0) NULL,
    CONSTRAINT CK_SeriesProposals_Status CHECK (Status IN ('draft','submitted','approved','rejected')),
    CONSTRAINT FK_SeriesProposals_Series FOREIGN KEY (SeriesId) REFERENCES dbo.Series(SeriesId),
    CONSTRAINT FK_SeriesProposals_SubmittedBy FOREIGN KEY (SubmittedById) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_SeriesProposals_ReviewedBy FOREIGN KEY (ReviewedById) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.Chapters
(
    ChapterId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Chapters PRIMARY KEY DEFAULT NEWID(),
    SeriesId        UNIQUEIDENTIFIER NOT NULL,
    ChapterNumber   INT NOT NULL,
    Title           NVARCHAR(255) NOT NULL,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_Chapters_Status DEFAULT 'draft',
    DueDate         DATE NULL,
    SubmittedForPublishingAt DATETIME2(0) NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Chapters_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Chapters_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Chapters_Series_Number UNIQUE (SeriesId, ChapterNumber),
    CONSTRAINT CK_Chapters_Status CHECK (Status IN ('draft','in_progress','review','approved','published','cancelled')),
    CONSTRAINT FK_Chapters_Series FOREIGN KEY (SeriesId) REFERENCES dbo.Series(SeriesId)
);

CREATE TABLE dbo.MangaPages
(
    PageId          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_MangaPages PRIMARY KEY DEFAULT NEWID(),
    ChapterId       UNIQUEIDENTIFIER NOT NULL,
    PageNumber      INT NOT NULL,
    CurrentImageUrl NVARCHAR(1000) NULL,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_MangaPages_Status DEFAULT 'pending',
    UploadedById    UNIQUEIDENTIFIER NULL,
    UploadedAt      DATETIME2(0) NULL,
    CONSTRAINT UQ_MangaPages_Chapter_PageNumber UNIQUE (ChapterId, PageNumber),
    CONSTRAINT CK_MangaPages_Status CHECK (Status IN ('pending','assigned','in_progress','submitted','review','approved','revision')),
    CONSTRAINT FK_MangaPages_Chapters FOREIGN KEY (ChapterId) REFERENCES dbo.Chapters(ChapterId),
    CONSTRAINT FK_MangaPages_UploadedBy FOREIGN KEY (UploadedById) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.PageVersions
(
    PageVersionId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PageVersions PRIMARY KEY DEFAULT NEWID(),
    PageId          UNIQUEIDENTIFIER NOT NULL,
    VersionNumber   INT NOT NULL,
    FileUrl         NVARCHAR(1000) NOT NULL,
    FileName        NVARCHAR(255) NOT NULL,
    FileSizeBytes   BIGINT NULL,
    MimeType        NVARCHAR(120) NULL,
    UploadedById    UNIQUEIDENTIFIER NOT NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_PageVersions_CreatedAt DEFAULT SYSUTCDATETIME(),
    Note            NVARCHAR(1000) NULL,
    CONSTRAINT UQ_PageVersions_Page_Version UNIQUE (PageId, VersionNumber),
    CONSTRAINT FK_PageVersions_Page FOREIGN KEY (PageId) REFERENCES dbo.MangaPages(PageId),
    CONSTRAINT FK_PageVersions_UploadedBy FOREIGN KEY (UploadedById) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.PageRegions
(
    RegionId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PageRegions PRIMARY KEY DEFAULT NEWID(),
    PageId          UNIQUEIDENTIFIER NOT NULL,
    Type            VARCHAR(30) NOT NULL,
    X               DECIMAL(9,2) NOT NULL,
    Y               DECIMAL(9,2) NOT NULL,
    Width           DECIMAL(9,2) NOT NULL,
    Height          DECIMAL(9,2) NOT NULL,
    AssignedToId    UNIQUEIDENTIFIER NULL,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_PageRegions_Status DEFAULT 'pending',
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_PageRegions_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_PageRegions_Type CHECK (Type IN ('line_art','background','effects','text','coloring','lettering')),
    CONSTRAINT CK_PageRegions_Status CHECK (Status IN ('pending','in_progress','completed')),
    CONSTRAINT FK_PageRegions_Page FOREIGN KEY (PageId) REFERENCES dbo.MangaPages(PageId),
    CONSTRAINT FK_PageRegions_AssignedTo FOREIGN KEY (AssignedToId) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.Tasks
(
    TaskId          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Tasks PRIMARY KEY DEFAULT NEWID(),
    Title           NVARCHAR(255) NOT NULL,
    Description     NVARCHAR(MAX) NULL,
    Type            VARCHAR(30) NOT NULL,
    PageId          UNIQUEIDENTIFIER NOT NULL,
    RegionId        UNIQUEIDENTIFIER NULL,
    AssigneeId      UNIQUEIDENTIFIER NULL,
    AssignerId      UNIQUEIDENTIFIER NOT NULL,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_Tasks_Status DEFAULT 'pending',
    DueDate         DATE NULL,
    PaymentAmount   DECIMAL(12,2) NOT NULL CONSTRAINT DF_Tasks_PaymentAmount DEFAULT 0,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Tasks_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Tasks_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Tasks_Type CHECK (Type IN ('line_art','background','effects','coloring','lettering','review')),
    CONSTRAINT CK_Tasks_Status CHECK (Status IN ('pending','in_progress','submitted','revision','approved','cancelled')),
    CONSTRAINT FK_Tasks_Page FOREIGN KEY (PageId) REFERENCES dbo.MangaPages(PageId),
    CONSTRAINT FK_Tasks_Region FOREIGN KEY (RegionId) REFERENCES dbo.PageRegions(RegionId),
    CONSTRAINT FK_Tasks_Assignee FOREIGN KEY (AssigneeId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Tasks_Assigner FOREIGN KEY (AssignerId) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.TaskSubmissions
(
    SubmissionId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TaskSubmissions PRIMARY KEY DEFAULT NEWID(),
    TaskId          UNIQUEIDENTIFIER NOT NULL,
    SubmittedById   UNIQUEIDENTIFIER NOT NULL,
    PageVersionId   UNIQUEIDENTIFIER NULL,
    Note            NVARCHAR(MAX) NULL,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_TaskSubmissions_Status DEFAULT 'submitted',
    SubmittedAt     DATETIME2(0) NOT NULL CONSTRAINT DF_TaskSubmissions_SubmittedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_TaskSubmissions_Status CHECK (Status IN ('submitted','accepted','revision_requested','rejected')),
    CONSTRAINT FK_TaskSubmissions_Task FOREIGN KEY (TaskId) REFERENCES dbo.Tasks(TaskId),
    CONSTRAINT FK_TaskSubmissions_SubmittedBy FOREIGN KEY (SubmittedById) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_TaskSubmissions_PageVersion FOREIGN KEY (PageVersionId) REFERENCES dbo.PageVersions(PageVersionId)
);

CREATE TABLE dbo.PageReviews
(
    ReviewId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PageReviews PRIMARY KEY DEFAULT NEWID(),
    PageId          UNIQUEIDENTIFIER NOT NULL,
    ReviewerId      UNIQUEIDENTIFIER NOT NULL,
    Decision        VARCHAR(30) NOT NULL,
    Comment         NVARCHAR(MAX) NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_PageReviews_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_PageReviews_Decision CHECK (Decision IN ('approved','revision_requested','rejected')),
    CONSTRAINT FK_PageReviews_Page FOREIGN KEY (PageId) REFERENCES dbo.MangaPages(PageId),
    CONSTRAINT FK_PageReviews_Reviewer FOREIGN KEY (ReviewerId) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.ReviewComments
(
    CommentId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ReviewComments PRIMARY KEY DEFAULT NEWID(),
    PageId          UNIQUEIDENTIFIER NOT NULL,
    UserId          UNIQUEIDENTIFIER NOT NULL,
    Body            NVARCHAR(MAX) NOT NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_ReviewComments_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ReviewComments_Page FOREIGN KEY (PageId) REFERENCES dbo.MangaPages(PageId),
    CONSTRAINT FK_ReviewComments_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.PageAnnotations
(
    AnnotationId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PageAnnotations PRIMARY KEY DEFAULT NEWID(),
    PageId          UNIQUEIDENTIFIER NOT NULL,
    CreatedById     UNIQUEIDENTIFIER NOT NULL,
    X               DECIMAL(9,2) NOT NULL,
    Y               DECIMAL(9,2) NOT NULL,
    Width           DECIMAL(9,2) NULL,
    Height          DECIMAL(9,2) NULL,
    Body            NVARCHAR(MAX) NOT NULL,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_PageAnnotations_Status DEFAULT 'open',
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_PageAnnotations_CreatedAt DEFAULT SYSUTCDATETIME(),
    ResolvedAt      DATETIME2(0) NULL,
    CONSTRAINT CK_PageAnnotations_Status CHECK (Status IN ('open','resolved')),
    CONSTRAINT FK_PageAnnotations_Page FOREIGN KEY (PageId) REFERENCES dbo.MangaPages(PageId),
    CONSTRAINT FK_PageAnnotations_CreatedBy FOREIGN KEY (CreatedById) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.Notifications
(
    NotificationId  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY DEFAULT NEWID(),
    UserId          UNIQUEIDENTIFIER NOT NULL,
    Type            VARCHAR(40) NOT NULL,
    Title           NVARCHAR(255) NOT NULL,
    Message         NVARCHAR(MAX) NOT NULL,
    IsRead          BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
    Link            NVARCHAR(1000) NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Notifications_Type CHECK (Type IN ('task_assigned','task_submitted','review_needed','payment','deadline','system')),
    CONSTRAINT FK_Notifications_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.PayrollRecords
(
    PayrollRecordId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PayrollRecords PRIMARY KEY DEFAULT NEWID(),
    AssistantId     UNIQUEIDENTIFIER NOT NULL,
    TaskId          UNIQUEIDENTIFIER NULL,
    PeriodStart     DATE NOT NULL,
    PeriodEnd       DATE NOT NULL,
    BaseAmount      DECIMAL(12,2) NOT NULL CONSTRAINT DF_PayrollRecords_BaseAmount DEFAULT 0,
    BonusAmount     DECIMAL(12,2) NOT NULL CONSTRAINT DF_PayrollRecords_BonusAmount DEFAULT 0,
    DeductionAmount DECIMAL(12,2) NOT NULL CONSTRAINT DF_PayrollRecords_DeductionAmount DEFAULT 0,
    TotalAmount     AS (BaseAmount + BonusAmount - DeductionAmount) PERSISTED,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_PayrollRecords_Status DEFAULT 'pending',
    PaidAt          DATETIME2(0) NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_PayrollRecords_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_PayrollRecords_Status CHECK (Status IN ('pending','processing','paid','failed')),
    CONSTRAINT FK_PayrollRecords_Assistant FOREIGN KEY (AssistantId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_PayrollRecords_Task FOREIGN KEY (TaskId) REFERENCES dbo.Tasks(TaskId)
);

CREATE TABLE dbo.PublishSchedules
(
    PublishScheduleId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PublishSchedules PRIMARY KEY DEFAULT NEWID(),
    ChapterId       UNIQUEIDENTIFIER NOT NULL,
    ScheduledDate   DATETIME2(0) NOT NULL,
    Status          VARCHAR(30) NOT NULL CONSTRAINT DF_PublishSchedules_Status DEFAULT 'scheduled',
    ApprovedById    UNIQUEIDENTIFIER NULL,
    PublishedAt     DATETIME2(0) NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_PublishSchedules_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_PublishSchedules_Status CHECK (Status IN ('scheduled','published','cancelled')),
    CONSTRAINT FK_PublishSchedules_Chapter FOREIGN KEY (ChapterId) REFERENCES dbo.Chapters(ChapterId),
    CONSTRAINT FK_PublishSchedules_ApprovedBy FOREIGN KEY (ApprovedById) REFERENCES dbo.Users(UserId)
);

CREATE TABLE dbo.ReaderVotes
(
    ReaderVoteId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ReaderVotes PRIMARY KEY DEFAULT NEWID(),
    SeriesId        UNIQUEIDENTIFIER NOT NULL,
    WeekNumber      INT NOT NULL,
    YearNumber      INT NOT NULL,
    Votes           INT NOT NULL CONSTRAINT DF_ReaderVotes_Votes DEFAULT 0,
    RankNumber      INT NOT NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_ReaderVotes_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_ReaderVotes_Series_Week UNIQUE (SeriesId, WeekNumber, YearNumber),
    CONSTRAINT CK_ReaderVotes_Week CHECK (WeekNumber BETWEEN 1 AND 53),
    CONSTRAINT FK_ReaderVotes_Series FOREIGN KEY (SeriesId) REFERENCES dbo.Series(SeriesId)
);

CREATE TABLE dbo.AuditLogs
(
    AuditLogId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditLogs PRIMARY KEY DEFAULT NEWID(),
    UserId          UNIQUEIDENTIFIER NULL,
    Action          NVARCHAR(120) NOT NULL,
    EntityType      NVARCHAR(120) NOT NULL,
    EntityId        UNIQUEIDENTIFIER NULL,
    DetailsJson     NVARCHAR(MAX) NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_AuditLogs_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_AuditLogs_DetailsJson CHECK (DetailsJson IS NULL OR ISJSON(DetailsJson) = 1),
    CONSTRAINT FK_AuditLogs_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);
GO

CREATE INDEX IX_Users_RoleId ON dbo.Users(RoleId);
CREATE INDEX IX_Series_MangakaId ON dbo.Series(MangakaId);
CREATE INDEX IX_Series_TantouId ON dbo.Series(TantouId);
CREATE INDEX IX_Series_Status_Ranking ON dbo.Series(Status, Ranking);
CREATE INDEX IX_Chapters_SeriesId_Status ON dbo.Chapters(SeriesId, Status);
CREATE INDEX IX_MangaPages_ChapterId_Status ON dbo.MangaPages(ChapterId, Status);
CREATE INDEX IX_PageRegions_PageId_Status ON dbo.PageRegions(PageId, Status);
CREATE INDEX IX_Tasks_AssigneeId_Status ON dbo.Tasks(AssigneeId, Status);
CREATE INDEX IX_Tasks_PageId ON dbo.Tasks(PageId);
CREATE INDEX IX_Notifications_UserId_IsRead ON dbo.Notifications(UserId, IsRead, CreatedAt DESC);
CREATE INDEX IX_PayrollRecords_AssistantId_Status ON dbo.PayrollRecords(AssistantId, Status);
CREATE INDEX IX_ReaderVotes_Week_Rank ON dbo.ReaderVotes(YearNumber, WeekNumber, RankNumber);
CREATE INDEX IX_AuditLogs_Entity ON dbo.AuditLogs(EntityType, EntityId, CreatedAt DESC);
GO

INSERT INTO dbo.Roles (Code, Name)
VALUES
    ('mangaka', N'Mangaka'),
    ('assistant', N'Assistant'),
    ('tantou', N'Tantou Editor'),
    ('editorial', N'Editorial Board');

DECLARE @MangakaRole INT = (SELECT RoleId FROM dbo.Roles WHERE Code = 'mangaka');
DECLARE @AssistantRole INT = (SELECT RoleId FROM dbo.Roles WHERE Code = 'assistant');
DECLARE @TantouRole INT = (SELECT RoleId FROM dbo.Roles WHERE Code = 'tantou');
DECLARE @EditorialRole INT = (SELECT RoleId FROM dbo.Roles WHERE Code = 'editorial');

DECLARE @Yuki UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';
DECLARE @Kenji UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';
DECLARE @Sakura UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333333';
DECLARE @Takeshi UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444444';
DECLARE @Mei UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555555';

INSERT INTO dbo.Users (UserId, RoleId, FullName, Email, Avatar)
VALUES
    (@Yuki, @MangakaRole, N'Yuki Tanaka', N'yuki@mangaflow.com', N'yuki'),
    (@Kenji, @AssistantRole, N'Kenji Yamamoto', N'kenji@mangaflow.com', N'kenji'),
    (@Mei, @AssistantRole, N'Mei Chen', N'mei@mangaflow.com', N'mei'),
    (@Sakura, @TantouRole, N'Sakura Ito', N'sakura@mangaflow.com', N'sakura'),
    (@Takeshi, @EditorialRole, N'Takeshi Sato', N'takeshi@mangaflow.com', N'takeshi');

INSERT INTO dbo.AssistantProfiles (AssistantId, Specialty, HourlyRate, Rating)
VALUES
    (@Kenji, N'Backgrounds', 18, 4.80),
    (@Mei, N'Effects', 15, 4.70);

DECLARE @Dragon UNIQUEIDENTIFIER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DECLARE @Night UNIQUEIDENTIFIER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DECLARE @Chapter45 UNIQUEIDENTIFIER = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
DECLARE @Chapter1 UNIQUEIDENTIFIER = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
DECLARE @Page1 UNIQUEIDENTIFIER = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
DECLARE @Page2 UNIQUEIDENTIFIER = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
DECLARE @Region1 UNIQUEIDENTIFIER = '12121212-1212-1212-1212-121212121212';
DECLARE @Task1 UNIQUEIDENTIFIER = '13131313-1313-1313-1313-131313131313';

INSERT INTO dbo.Series (SeriesId, Title, Synopsis, Status, MangakaId, TantouId, Ranking, ReaderCount, Rating)
VALUES
    (@Dragon, N'Dragon Hunters', N'Action fantasy manga series used for studio workflow tracking.', 'active', @Yuki, @Sakura, 3, 125000, 4.80),
    (@Night, N'Night Bloom', N'Romance and mystery series awaiting editorial approval.', 'proposal', @Yuki, @Sakura, 6, 89000, 4.60);

INSERT INTO dbo.SeriesGenres (SeriesId, Genre)
VALUES
    (@Dragon, N'Action'),
    (@Dragon, N'Fantasy'),
    (@Night, N'Romance'),
    (@Night, N'Mystery');

INSERT INTO dbo.SeriesProposals (SeriesId, SubmittedById, ReviewedById, Status, ReviewNote, ReviewedAt)
VALUES
    (@Dragon, @Yuki, @Takeshi, 'approved', N'Approved for regular publication.', SYSUTCDATETIME()),
    (@Night, @Yuki, NULL, 'submitted', NULL, NULL);

INSERT INTO dbo.Chapters (ChapterId, SeriesId, ChapterNumber, Title, Status, DueDate)
VALUES
    (@Chapter45, @Dragon, 45, N'The Final Battle', 'review', '2026-06-05'),
    (@Chapter1, @Night, 1, N'Opening Night', 'draft', '2026-06-12');

INSERT INTO dbo.MangaPages (PageId, ChapterId, PageNumber, CurrentImageUrl, Status, UploadedById, UploadedAt)
VALUES
    (@Page1, @Chapter45, 1, N'/uploads/dragon-hunters/ch45/page_001.png', 'submitted', @Yuki, SYSUTCDATETIME()),
    (@Page2, @Chapter45, 2, N'/uploads/dragon-hunters/ch45/page_002.png', 'assigned', @Yuki, SYSUTCDATETIME());

INSERT INTO dbo.PageVersions (PageId, VersionNumber, FileUrl, FileName, FileSizeBytes, MimeType, UploadedById, Note)
VALUES
    (@Page1, 1, N'/uploads/dragon-hunters/ch45/page_001_v1.png', N'page_001.png', 2516582, N'image/png', @Yuki, N'Initial upload'),
    (@Page2, 1, N'/uploads/dragon-hunters/ch45/page_002_v1.png', N'page_002.png', 2202009, N'image/png', @Yuki, N'Initial upload');

INSERT INTO dbo.PageRegions (RegionId, PageId, Type, X, Y, Width, Height, AssignedToId, Status)
VALUES
    (@Region1, @Page2, 'background', 0, 0, 800, 1200, @Kenji, 'in_progress');

INSERT INTO dbo.Tasks (TaskId, Title, Description, Type, PageId, RegionId, AssigneeId, AssignerId, Status, DueDate, PaymentAmount)
VALUES
    (@Task1, N'Background cleanup page 2', N'Clean and finish background region.', 'background', @Page2, @Region1, @Kenji, @Yuki, 'in_progress', '2026-05-30', 180);

INSERT INTO dbo.PageAnnotations (PageId, CreatedById, X, Y, Width, Height, Body)
VALUES
    (@Page1, @Sakura, 180, 260, 120, 80, N'Adjust panel transition before approval.');

INSERT INTO dbo.ReviewComments (PageId, UserId, Body)
VALUES
    (@Page1, @Sakura, N'The panel transitions look good. One small fix remains.');

INSERT INTO dbo.Notifications (UserId, Type, Title, Message, Link)
VALUES
    (@Kenji, 'task_assigned', N'New task assigned', N'Background cleanup page 2 has been assigned to you.', N'/tasks'),
    (@Yuki, 'review_needed', N'Page review comment', N'Chapter 45 page 1 has a new annotation.', N'/review');

INSERT INTO dbo.PayrollRecords (AssistantId, TaskId, PeriodStart, PeriodEnd, BaseAmount, BonusAmount, DeductionAmount, Status)
VALUES
    (@Kenji, @Task1, '2026-05-16', '2026-05-31', 180, 0, 0, 'pending');

INSERT INTO dbo.PublishSchedules (ChapterId, ScheduledDate, Status, ApprovedById)
VALUES
    (@Chapter45, '2026-06-10T09:00:00', 'scheduled', @Takeshi);

INSERT INTO dbo.ReaderVotes (SeriesId, WeekNumber, YearNumber, Votes, RankNumber)
VALUES
    (@Dragon, 20, 2026, 2250, 3),
    (@Night, 20, 2026, 1850, 6);

INSERT INTO dbo.AuditLogs (UserId, Action, EntityType, EntityId, DetailsJson)
VALUES
    (@Takeshi, N'approve_series', N'Series', @Dragon, N'{"status":"approved"}'),
    (@Yuki, N'upload_pages', N'Chapter', @Chapter45, N'{"pages":2}');
GO

SELECT
    DB_NAME() AS DatabaseName,
    (SELECT COUNT(*) FROM dbo.Users) AS UsersCount,
    (SELECT COUNT(*) FROM dbo.Series) AS SeriesCount,
    (SELECT COUNT(*) FROM dbo.Chapters) AS ChaptersCount,
    (SELECT COUNT(*) FROM dbo.Tasks) AS TasksCount;
GO
