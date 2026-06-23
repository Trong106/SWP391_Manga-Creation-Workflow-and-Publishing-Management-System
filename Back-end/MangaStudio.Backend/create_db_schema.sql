USE [master];
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MangaStudioWorkflow')
BEGIN
    CREATE DATABASE [MangaStudioWorkflow];
    PRINT 'Database MangaStudioWorkflow created successfully.';
END
ELSE
BEGIN
    PRINT 'Database MangaStudioWorkflow already exists.';
END
GO

USE [MangaStudioWorkflow];
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Roles](
	[RoleId] [int] IDENTITY(1,1) NOT NULL,
	[Code] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Name] [nvarchar](80) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED 
(
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_Roles_Code] UNIQUE NONCLUSTERED 
(
	[Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Users](
	[UserId] [uniqueidentifier] NOT NULL,
	[RoleId] [int] NOT NULL,
	[FullName] [nvarchar](160) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Email] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[PasswordHash] [nvarchar](500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Avatar] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[UpdatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED 
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_Users_Email] UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Series](
	[SeriesId] [uniqueidentifier] NOT NULL,
	[Title] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TitleJp] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Synopsis] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[CoverImageUrl] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MangakaId] [uniqueidentifier] NOT NULL,
	[TantouId] [uniqueidentifier] NULL,
	[Ranking] [int] NULL,
	[ReaderCount] [int] NOT NULL,
	[Rating] [decimal](3, 2) NULL,
	[CancellationReason] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[UpdatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_Series] PRIMARY KEY CLUSTERED 
(
	[SeriesId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Notifications](
	[NotificationId] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[Type] [varchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Title] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Message] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IsRead] [bit] NOT NULL,
	[Link] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED 
(
	[NotificationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[AuditLogs](
	[AuditLogId] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NULL,
	[Action] [nvarchar](120) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[EntityType] [nvarchar](120) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[EntityId] [uniqueidentifier] NULL,
	[DetailsJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_AuditLogs] PRIMARY KEY CLUSTERED 
(
	[AuditLogId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[AssistantProfiles](
	[AssistantId] [uniqueidentifier] NOT NULL,
	[Specialty] [nvarchar](120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HourlyRate] [decimal](12, 2) NOT NULL,
	[Rating] [decimal](3, 2) NULL,
 CONSTRAINT [PK_AssistantProfiles] PRIMARY KEY CLUSTERED 
(
	[AssistantId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Chapters](
	[ChapterId] [uniqueidentifier] NOT NULL,
	[SeriesId] [uniqueidentifier] NOT NULL,
	[ChapterNumber] [int] NOT NULL,
	[Title] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DueDate] [date] NULL,
	[SubmittedForPublishingAt] [datetime2](0) NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[UpdatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_Chapters] PRIMARY KEY CLUSTERED 
(
	[ChapterId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_Chapters_Series_Number] UNIQUE NONCLUSTERED 
(
	[SeriesId] ASC,
	[ChapterNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[SeriesProposals](
	[ProposalId] [uniqueidentifier] NOT NULL,
	[SeriesId] [uniqueidentifier] NOT NULL,
	[SubmittedById] [uniqueidentifier] NOT NULL,
	[ReviewedById] [uniqueidentifier] NULL,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ReviewNote] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[SubmittedAt] [datetime2](0) NOT NULL,
	[ReviewedAt] [datetime2](0) NULL,
 CONSTRAINT [PK_SeriesProposals] PRIMARY KEY CLUSTERED 
(
	[ProposalId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[SeriesGenres](
	[SeriesId] [uniqueidentifier] NOT NULL,
	[Genre] [nvarchar](80) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK_SeriesGenres] PRIMARY KEY CLUSTERED 
(
	[SeriesId] ASC,
	[Genre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[ReaderVotes](
	[ReaderVoteId] [uniqueidentifier] NOT NULL,
	[SeriesId] [uniqueidentifier] NOT NULL,
	[WeekNumber] [int] NOT NULL,
	[YearNumber] [int] NOT NULL,
	[Votes] [int] NOT NULL,
	[RankNumber] [int] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_ReaderVotes] PRIMARY KEY CLUSTERED 
(
	[ReaderVoteId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_ReaderVotes_Series_Week] UNIQUE NONCLUSTERED 
(
	[SeriesId] ASC,
	[WeekNumber] ASC,
	[YearNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[PublishSchedules](
	[PublishScheduleId] [uniqueidentifier] NOT NULL,
	[ChapterId] [uniqueidentifier] NOT NULL,
	[ScheduledDate] [datetime2](0) NOT NULL,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ApprovedById] [uniqueidentifier] NULL,
	[PublishedAt] [datetime2](0) NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_PublishSchedules] PRIMARY KEY CLUSTERED 
(
	[PublishScheduleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[MangaPages](
	[PageId] [uniqueidentifier] NOT NULL,
	[ChapterId] [uniqueidentifier] NOT NULL,
	[PageNumber] [int] NOT NULL,
	[CurrentImageUrl] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[UploadedById] [uniqueidentifier] NULL,
	[UploadedAt] [datetime2](0) NULL,
 CONSTRAINT [PK_MangaPages] PRIMARY KEY CLUSTERED 
(
	[PageId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_MangaPages_Chapter_PageNumber] UNIQUE NONCLUSTERED 
(
	[ChapterId] ASC,
	[PageNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[PageVersions](
	[PageVersionId] [uniqueidentifier] NOT NULL,
	[PageId] [uniqueidentifier] NOT NULL,
	[VersionNumber] [int] NOT NULL,
	[FileUrl] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[FileName] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[FileSizeBytes] [bigint] NULL,
	[MimeType] [nvarchar](120) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[UploadedById] [uniqueidentifier] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[Note] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
 CONSTRAINT [PK_PageVersions] PRIMARY KEY CLUSTERED 
(
	[PageVersionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_PageVersions_Page_Version] UNIQUE NONCLUSTERED 
(
	[PageId] ASC,
	[VersionNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[PageReviews](
	[ReviewId] [uniqueidentifier] NOT NULL,
	[PageId] [uniqueidentifier] NOT NULL,
	[ReviewerId] [uniqueidentifier] NOT NULL,
	[Decision] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Comment] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_PageReviews] PRIMARY KEY CLUSTERED 
(
	[ReviewId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[PageRegions](
	[RegionId] [uniqueidentifier] NOT NULL,
	[PageId] [uniqueidentifier] NOT NULL,
	[Type] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[X] [decimal](9, 2) NOT NULL,
	[Y] [decimal](9, 2) NOT NULL,
	[Width] [decimal](9, 2) NOT NULL,
	[Height] [decimal](9, 2) NOT NULL,
	[AssignedToId] [uniqueidentifier] NULL,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_PageRegions] PRIMARY KEY CLUSTERED 
(
	[RegionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[PageAnnotations](
	[AnnotationId] [uniqueidentifier] NOT NULL,
	[PageId] [uniqueidentifier] NOT NULL,
	[CreatedById] [uniqueidentifier] NOT NULL,
	[X] [decimal](9, 2) NOT NULL,
	[Y] [decimal](9, 2) NOT NULL,
	[Width] [decimal](9, 2) NULL,
	[Height] [decimal](9, 2) NULL,
	[Body] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[ResolvedAt] [datetime2](0) NULL,
 CONSTRAINT [PK_PageAnnotations] PRIMARY KEY CLUSTERED 
(
	[AnnotationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[ReviewComments](
	[CommentId] [uniqueidentifier] NOT NULL,
	[PageId] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[Body] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_ReviewComments] PRIMARY KEY CLUSTERED 
(
	[CommentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Tasks](
	[TaskId] [uniqueidentifier] NOT NULL,
	[Title] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Description] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Type] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[PageId] [uniqueidentifier] NOT NULL,
	[RegionId] [uniqueidentifier] NULL,
	[AssigneeId] [uniqueidentifier] NULL,
	[AssignerId] [uniqueidentifier] NOT NULL,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DueDate] [date] NULL,
	[PaymentAmount] [decimal](12, 2) NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[UpdatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_Tasks] PRIMARY KEY CLUSTERED 
(
	[TaskId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[PayrollRecords](
	[PayrollRecordId] [uniqueidentifier] NOT NULL,
	[AssistantId] [uniqueidentifier] NOT NULL,
	[TaskId] [uniqueidentifier] NULL,
	[PeriodStart] [date] NOT NULL,
	[PeriodEnd] [date] NOT NULL,
	[BaseAmount] [decimal](12, 2) NOT NULL,
	[BonusAmount] [decimal](12, 2) NOT NULL,
	[DeductionAmount] [decimal](12, 2) NOT NULL,
	[TotalAmount]  AS (([BaseAmount]+[BonusAmount])-[DeductionAmount]) PERSISTED,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[PaidAt] [datetime2](0) NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_PayrollRecords] PRIMARY KEY CLUSTERED 
(
	[PayrollRecordId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[TaskSubmissions](
	[SubmissionId] [uniqueidentifier] NOT NULL,
	[TaskId] [uniqueidentifier] NOT NULL,
	[SubmittedById] [uniqueidentifier] NOT NULL,
	[PageVersionId] [uniqueidentifier] NULL,
	[Note] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Status] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[SubmittedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_TaskSubmissions] PRIMARY KEY CLUSTERED 
(
	[SubmissionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

CREATE NONCLUSTERED INDEX [IX_Users_RoleId] ON [dbo].[Users]
(
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_Series_MangakaId] ON [dbo].[Series]
(
	[MangakaId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

CREATE NONCLUSTERED INDEX [IX_Series_Status_Ranking] ON [dbo].[Series]
(
	[Status] ASC,
	[Ranking] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_Series_TantouId] ON [dbo].[Series]
(
	[TantouId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_Notifications_UserId_IsRead] ON [dbo].[Notifications]
(
	[UserId] ASC,
	[IsRead] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

CREATE NONCLUSTERED INDEX [IX_AuditLogs_Entity] ON [dbo].[AuditLogs]
(
	[EntityType] ASC,
	[EntityId] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

CREATE NONCLUSTERED INDEX [IX_Chapters_SeriesId_Status] ON [dbo].[Chapters]
(
	[SeriesId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_ReaderVotes_Week_Rank] ON [dbo].[ReaderVotes]
(
	[YearNumber] ASC,
	[WeekNumber] ASC,
	[RankNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

CREATE NONCLUSTERED INDEX [IX_MangaPages_ChapterId_Status] ON [dbo].[MangaPages]
(
	[ChapterId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

CREATE NONCLUSTERED INDEX [IX_PageRegions_PageId_Status] ON [dbo].[PageRegions]
(
	[PageId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

CREATE NONCLUSTERED INDEX [IX_Tasks_AssigneeId_Status] ON [dbo].[Tasks]
(
	[AssigneeId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_Tasks_PageId] ON [dbo].[Tasks]
(
	[PageId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

CREATE NONCLUSTERED INDEX [IX_PayrollRecords_AssistantId_Status] ON [dbo].[PayrollRecords]
(
	[AssistantId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Users] ADD  DEFAULT (newid()) FOR [UserId]
GO

ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO

ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO

ALTER TABLE [dbo].[Series] ADD  DEFAULT (newid()) FOR [SeriesId]
GO

ALTER TABLE [dbo].[Series] ADD  CONSTRAINT [DF_Series_Status]  DEFAULT ('proposal') FOR [Status]
GO

ALTER TABLE [dbo].[Series] ADD  CONSTRAINT [DF_Series_ReaderCount]  DEFAULT ((0)) FOR [ReaderCount]
GO

ALTER TABLE [dbo].[Series] ADD  CONSTRAINT [DF_Series_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[Series] ADD  CONSTRAINT [DF_Series_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO

ALTER TABLE [dbo].[Notifications] ADD  DEFAULT (newid()) FOR [NotificationId]
GO

ALTER TABLE [dbo].[Notifications] ADD  CONSTRAINT [DF_Notifications_IsRead]  DEFAULT ((0)) FOR [IsRead]
GO

ALTER TABLE [dbo].[Notifications] ADD  CONSTRAINT [DF_Notifications_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[AuditLogs] ADD  DEFAULT (newid()) FOR [AuditLogId]
GO

ALTER TABLE [dbo].[AuditLogs] ADD  CONSTRAINT [DF_AuditLogs_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[AssistantProfiles] ADD  CONSTRAINT [DF_AssistantProfiles_HourlyRate]  DEFAULT ((0)) FOR [HourlyRate]
GO

ALTER TABLE [dbo].[Chapters] ADD  DEFAULT (newid()) FOR [ChapterId]
GO

ALTER TABLE [dbo].[Chapters] ADD  CONSTRAINT [DF_Chapters_Status]  DEFAULT ('draft') FOR [Status]
GO

ALTER TABLE [dbo].[Chapters] ADD  CONSTRAINT [DF_Chapters_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[Chapters] ADD  CONSTRAINT [DF_Chapters_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO

ALTER TABLE [dbo].[SeriesProposals] ADD  DEFAULT (newid()) FOR [ProposalId]
GO

ALTER TABLE [dbo].[SeriesProposals] ADD  CONSTRAINT [DF_SeriesProposals_Status]  DEFAULT ('submitted') FOR [Status]
GO

ALTER TABLE [dbo].[SeriesProposals] ADD  CONSTRAINT [DF_SeriesProposals_SubmittedAt]  DEFAULT (sysutcdatetime()) FOR [SubmittedAt]
GO

ALTER TABLE [dbo].[ReaderVotes] ADD  DEFAULT (newid()) FOR [ReaderVoteId]
GO

ALTER TABLE [dbo].[ReaderVotes] ADD  CONSTRAINT [DF_ReaderVotes_Votes]  DEFAULT ((0)) FOR [Votes]
GO

ALTER TABLE [dbo].[ReaderVotes] ADD  CONSTRAINT [DF_ReaderVotes_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[PublishSchedules] ADD  DEFAULT (newid()) FOR [PublishScheduleId]
GO

ALTER TABLE [dbo].[PublishSchedules] ADD  CONSTRAINT [DF_PublishSchedules_Status]  DEFAULT ('scheduled') FOR [Status]
GO

ALTER TABLE [dbo].[PublishSchedules] ADD  CONSTRAINT [DF_PublishSchedules_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[MangaPages] ADD  DEFAULT (newid()) FOR [PageId]
GO

ALTER TABLE [dbo].[MangaPages] ADD  CONSTRAINT [DF_MangaPages_Status]  DEFAULT ('pending') FOR [Status]
GO

ALTER TABLE [dbo].[PageVersions] ADD  DEFAULT (newid()) FOR [PageVersionId]
GO

ALTER TABLE [dbo].[PageVersions] ADD  CONSTRAINT [DF_PageVersions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[PageReviews] ADD  DEFAULT (newid()) FOR [ReviewId]
GO

ALTER TABLE [dbo].[PageReviews] ADD  CONSTRAINT [DF_PageReviews_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[PageRegions] ADD  DEFAULT (newid()) FOR [RegionId]
GO

ALTER TABLE [dbo].[PageRegions] ADD  CONSTRAINT [DF_PageRegions_Status]  DEFAULT ('pending') FOR [Status]
GO

ALTER TABLE [dbo].[PageRegions] ADD  CONSTRAINT [DF_PageRegions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[PageAnnotations] ADD  DEFAULT (newid()) FOR [AnnotationId]
GO

ALTER TABLE [dbo].[PageAnnotations] ADD  CONSTRAINT [DF_PageAnnotations_Status]  DEFAULT ('open') FOR [Status]
GO

ALTER TABLE [dbo].[PageAnnotations] ADD  CONSTRAINT [DF_PageAnnotations_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[ReviewComments] ADD  DEFAULT (newid()) FOR [CommentId]
GO

ALTER TABLE [dbo].[ReviewComments] ADD  CONSTRAINT [DF_ReviewComments_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[Tasks] ADD  DEFAULT (newid()) FOR [TaskId]
GO

ALTER TABLE [dbo].[Tasks] ADD  CONSTRAINT [DF_Tasks_Status]  DEFAULT ('pending') FOR [Status]
GO

ALTER TABLE [dbo].[Tasks] ADD  CONSTRAINT [DF_Tasks_PaymentAmount]  DEFAULT ((0)) FOR [PaymentAmount]
GO

ALTER TABLE [dbo].[Tasks] ADD  CONSTRAINT [DF_Tasks_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[Tasks] ADD  CONSTRAINT [DF_Tasks_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO

ALTER TABLE [dbo].[PayrollRecords] ADD  DEFAULT (newid()) FOR [PayrollRecordId]
GO

ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_BaseAmount]  DEFAULT ((0)) FOR [BaseAmount]
GO

ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_BonusAmount]  DEFAULT ((0)) FOR [BonusAmount]
GO

ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_DeductionAmount]  DEFAULT ((0)) FOR [DeductionAmount]
GO

ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_Status]  DEFAULT ('pending') FOR [Status]
GO

ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[TaskSubmissions] ADD  DEFAULT (newid()) FOR [SubmissionId]
GO

ALTER TABLE [dbo].[TaskSubmissions] ADD  CONSTRAINT [DF_TaskSubmissions_Status]  DEFAULT ('submitted') FOR [Status]
GO

ALTER TABLE [dbo].[TaskSubmissions] ADD  CONSTRAINT [DF_TaskSubmissions_SubmittedAt]  DEFAULT (sysutcdatetime()) FOR [SubmittedAt]
GO

ALTER TABLE [dbo].[Users]  WITH CHECK ADD  CONSTRAINT [FK_Users_Roles] FOREIGN KEY([RoleId])
REFERENCES [dbo].[Roles] ([RoleId])
GO

ALTER TABLE [dbo].[Users] CHECK CONSTRAINT [FK_Users_Roles]
GO

ALTER TABLE [dbo].[Series]  WITH CHECK ADD  CONSTRAINT [FK_Series_Mangaka] FOREIGN KEY([MangakaId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[Series] CHECK CONSTRAINT [FK_Series_Mangaka]
GO

ALTER TABLE [dbo].[Series]  WITH CHECK ADD  CONSTRAINT [FK_Series_Tantou] FOREIGN KEY([TantouId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[Series] CHECK CONSTRAINT [FK_Series_Tantou]
GO

ALTER TABLE [dbo].[Notifications]  WITH CHECK ADD  CONSTRAINT [FK_Notifications_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[Notifications] CHECK CONSTRAINT [FK_Notifications_User]
GO

ALTER TABLE [dbo].[AuditLogs]  WITH CHECK ADD  CONSTRAINT [FK_AuditLogs_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[AuditLogs] CHECK CONSTRAINT [FK_AuditLogs_User]
GO

ALTER TABLE [dbo].[AssistantProfiles]  WITH CHECK ADD  CONSTRAINT [FK_AssistantProfiles_Users] FOREIGN KEY([AssistantId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[AssistantProfiles] CHECK CONSTRAINT [FK_AssistantProfiles_Users]
GO

ALTER TABLE [dbo].[Chapters]  WITH CHECK ADD  CONSTRAINT [FK_Chapters_Series] FOREIGN KEY([SeriesId])
REFERENCES [dbo].[Series] ([SeriesId])
GO

ALTER TABLE [dbo].[Chapters] CHECK CONSTRAINT [FK_Chapters_Series]
GO

ALTER TABLE [dbo].[SeriesProposals]  WITH CHECK ADD  CONSTRAINT [FK_SeriesProposals_ReviewedBy] FOREIGN KEY([ReviewedById])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[SeriesProposals] CHECK CONSTRAINT [FK_SeriesProposals_ReviewedBy]
GO

ALTER TABLE [dbo].[SeriesProposals]  WITH CHECK ADD  CONSTRAINT [FK_SeriesProposals_Series] FOREIGN KEY([SeriesId])
REFERENCES [dbo].[Series] ([SeriesId])
GO

ALTER TABLE [dbo].[SeriesProposals] CHECK CONSTRAINT [FK_SeriesProposals_Series]
GO

ALTER TABLE [dbo].[SeriesProposals]  WITH CHECK ADD  CONSTRAINT [FK_SeriesProposals_SubmittedBy] FOREIGN KEY([SubmittedById])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[SeriesProposals] CHECK CONSTRAINT [FK_SeriesProposals_SubmittedBy]
GO

ALTER TABLE [dbo].[SeriesGenres]  WITH CHECK ADD  CONSTRAINT [FK_SeriesGenres_Series] FOREIGN KEY([SeriesId])
REFERENCES [dbo].[Series] ([SeriesId])
GO

ALTER TABLE [dbo].[SeriesGenres] CHECK CONSTRAINT [FK_SeriesGenres_Series]
GO

ALTER TABLE [dbo].[ReaderVotes]  WITH CHECK ADD  CONSTRAINT [FK_ReaderVotes_Series] FOREIGN KEY([SeriesId])
REFERENCES [dbo].[Series] ([SeriesId])
GO

ALTER TABLE [dbo].[ReaderVotes] CHECK CONSTRAINT [FK_ReaderVotes_Series]
GO

ALTER TABLE [dbo].[PublishSchedules]  WITH CHECK ADD  CONSTRAINT [FK_PublishSchedules_ApprovedBy] FOREIGN KEY([ApprovedById])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[PublishSchedules] CHECK CONSTRAINT [FK_PublishSchedules_ApprovedBy]
GO

ALTER TABLE [dbo].[PublishSchedules]  WITH CHECK ADD  CONSTRAINT [FK_PublishSchedules_Chapter] FOREIGN KEY([ChapterId])
REFERENCES [dbo].[Chapters] ([ChapterId])
GO

ALTER TABLE [dbo].[PublishSchedules] CHECK CONSTRAINT [FK_PublishSchedules_Chapter]
GO

ALTER TABLE [dbo].[MangaPages]  WITH CHECK ADD  CONSTRAINT [FK_MangaPages_Chapters] FOREIGN KEY([ChapterId])
REFERENCES [dbo].[Chapters] ([ChapterId])
GO

ALTER TABLE [dbo].[MangaPages] CHECK CONSTRAINT [FK_MangaPages_Chapters]
GO

ALTER TABLE [dbo].[MangaPages]  WITH CHECK ADD  CONSTRAINT [FK_MangaPages_UploadedBy] FOREIGN KEY([UploadedById])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[MangaPages] CHECK CONSTRAINT [FK_MangaPages_UploadedBy]
GO

ALTER TABLE [dbo].[PageVersions]  WITH CHECK ADD  CONSTRAINT [FK_PageVersions_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
GO

ALTER TABLE [dbo].[PageVersions] CHECK CONSTRAINT [FK_PageVersions_Page]
GO

ALTER TABLE [dbo].[PageVersions]  WITH CHECK ADD  CONSTRAINT [FK_PageVersions_UploadedBy] FOREIGN KEY([UploadedById])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[PageVersions] CHECK CONSTRAINT [FK_PageVersions_UploadedBy]
GO

ALTER TABLE [dbo].[PageReviews]  WITH CHECK ADD  CONSTRAINT [FK_PageReviews_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
GO

ALTER TABLE [dbo].[PageReviews] CHECK CONSTRAINT [FK_PageReviews_Page]
GO

ALTER TABLE [dbo].[PageReviews]  WITH CHECK ADD  CONSTRAINT [FK_PageReviews_Reviewer] FOREIGN KEY([ReviewerId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[PageReviews] CHECK CONSTRAINT [FK_PageReviews_Reviewer]
GO

ALTER TABLE [dbo].[PageRegions]  WITH CHECK ADD  CONSTRAINT [FK_PageRegions_AssignedTo] FOREIGN KEY([AssignedToId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[PageRegions] CHECK CONSTRAINT [FK_PageRegions_AssignedTo]
GO

ALTER TABLE [dbo].[PageRegions]  WITH CHECK ADD  CONSTRAINT [FK_PageRegions_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
GO

ALTER TABLE [dbo].[PageRegions] CHECK CONSTRAINT [FK_PageRegions_Page]
GO

ALTER TABLE [dbo].[PageAnnotations]  WITH CHECK ADD  CONSTRAINT [FK_PageAnnotations_CreatedBy] FOREIGN KEY([CreatedById])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[PageAnnotations] CHECK CONSTRAINT [FK_PageAnnotations_CreatedBy]
GO

ALTER TABLE [dbo].[PageAnnotations]  WITH CHECK ADD  CONSTRAINT [FK_PageAnnotations_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
GO

ALTER TABLE [dbo].[PageAnnotations] CHECK CONSTRAINT [FK_PageAnnotations_Page]
GO

ALTER TABLE [dbo].[ReviewComments]  WITH CHECK ADD  CONSTRAINT [FK_ReviewComments_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
GO

ALTER TABLE [dbo].[ReviewComments] CHECK CONSTRAINT [FK_ReviewComments_Page]
GO

ALTER TABLE [dbo].[ReviewComments]  WITH CHECK ADD  CONSTRAINT [FK_ReviewComments_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[ReviewComments] CHECK CONSTRAINT [FK_ReviewComments_User]
GO

ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [FK_Tasks_Assignee] FOREIGN KEY([AssigneeId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [FK_Tasks_Assignee]
GO

ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [FK_Tasks_Assigner] FOREIGN KEY([AssignerId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [FK_Tasks_Assigner]
GO

ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [FK_Tasks_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
GO

ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [FK_Tasks_Page]
GO

ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [FK_Tasks_Region] FOREIGN KEY([RegionId])
REFERENCES [dbo].[PageRegions] ([RegionId])
GO

ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [FK_Tasks_Region]
GO

ALTER TABLE [dbo].[PayrollRecords]  WITH CHECK ADD  CONSTRAINT [FK_PayrollRecords_Assistant] FOREIGN KEY([AssistantId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[PayrollRecords] CHECK CONSTRAINT [FK_PayrollRecords_Assistant]
GO

ALTER TABLE [dbo].[PayrollRecords]  WITH CHECK ADD  CONSTRAINT [FK_PayrollRecords_Task] FOREIGN KEY([TaskId])
REFERENCES [dbo].[Tasks] ([TaskId])
GO

ALTER TABLE [dbo].[PayrollRecords] CHECK CONSTRAINT [FK_PayrollRecords_Task]
GO

ALTER TABLE [dbo].[TaskSubmissions]  WITH CHECK ADD  CONSTRAINT [FK_TaskSubmissions_PageVersion] FOREIGN KEY([PageVersionId])
REFERENCES [dbo].[PageVersions] ([PageVersionId])
GO

ALTER TABLE [dbo].[TaskSubmissions] CHECK CONSTRAINT [FK_TaskSubmissions_PageVersion]
GO

ALTER TABLE [dbo].[TaskSubmissions]  WITH CHECK ADD  CONSTRAINT [FK_TaskSubmissions_SubmittedBy] FOREIGN KEY([SubmittedById])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[TaskSubmissions] CHECK CONSTRAINT [FK_TaskSubmissions_SubmittedBy]
GO

ALTER TABLE [dbo].[TaskSubmissions]  WITH CHECK ADD  CONSTRAINT [FK_TaskSubmissions_Task] FOREIGN KEY([TaskId])
REFERENCES [dbo].[Tasks] ([TaskId])
GO

ALTER TABLE [dbo].[TaskSubmissions] CHECK CONSTRAINT [FK_TaskSubmissions_Task]
GO

ALTER TABLE [dbo].[Series]  WITH CHECK ADD  CONSTRAINT [CK_Series_Status] CHECK  (([Status]='cancelled' OR [Status]='completed' OR [Status]='hiatus' OR [Status]='active' OR [Status]='proposal'))
GO

ALTER TABLE [dbo].[Series] CHECK CONSTRAINT [CK_Series_Status]
GO

ALTER TABLE [dbo].[Notifications]  WITH CHECK ADD  CONSTRAINT [CK_Notifications_Type] CHECK  (([Type]='system' OR [Type]='deadline' OR [Type]='payment' OR [Type]='review_needed' OR [Type]='task_submitted' OR [Type]='task_assigned'))
GO

ALTER TABLE [dbo].[Notifications] CHECK CONSTRAINT [CK_Notifications_Type]
GO

ALTER TABLE [dbo].[AuditLogs]  WITH CHECK ADD  CONSTRAINT [CK_AuditLogs_DetailsJson] CHECK  (([DetailsJson] IS NULL OR isjson([DetailsJson])=(1)))
GO

ALTER TABLE [dbo].[AuditLogs] CHECK CONSTRAINT [CK_AuditLogs_DetailsJson]
GO

ALTER TABLE [dbo].[Chapters]  WITH CHECK ADD  CONSTRAINT [CK_Chapters_Status] CHECK  (([Status]='cancelled' OR [Status]='published' OR [Status]='approved' OR [Status]='review' OR [Status]='in_progress' OR [Status]='draft'))
GO

ALTER TABLE [dbo].[Chapters] CHECK CONSTRAINT [CK_Chapters_Status]
GO

ALTER TABLE [dbo].[SeriesProposals]  WITH CHECK ADD  CONSTRAINT [CK_SeriesProposals_Status] CHECK  (([Status]='rejected' OR [Status]='approved' OR [Status]='submitted' OR [Status]='draft'))
GO

ALTER TABLE [dbo].[SeriesProposals] CHECK CONSTRAINT [CK_SeriesProposals_Status]
GO

ALTER TABLE [dbo].[ReaderVotes]  WITH CHECK ADD  CONSTRAINT [CK_ReaderVotes_Week] CHECK  (([WeekNumber]>=(1) AND [WeekNumber]<=(53)))
GO

ALTER TABLE [dbo].[ReaderVotes] CHECK CONSTRAINT [CK_ReaderVotes_Week]
GO

ALTER TABLE [dbo].[PublishSchedules]  WITH CHECK ADD  CONSTRAINT [CK_PublishSchedules_Status] CHECK  (([Status]='cancelled' OR [Status]='published' OR [Status]='scheduled'))
GO

ALTER TABLE [dbo].[PublishSchedules] CHECK CONSTRAINT [CK_PublishSchedules_Status]
GO

ALTER TABLE [dbo].[MangaPages]  WITH CHECK ADD  CONSTRAINT [CK_MangaPages_Status] CHECK  (([Status]='revision' OR [Status]='approved' OR [Status]='review' OR [Status]='submitted' OR [Status]='in_progress' OR [Status]='assigned' OR [Status]='pending'))
GO

ALTER TABLE [dbo].[MangaPages] CHECK CONSTRAINT [CK_MangaPages_Status]
GO

ALTER TABLE [dbo].[PageReviews]  WITH CHECK ADD  CONSTRAINT [CK_PageReviews_Decision] CHECK  (([Decision]='rejected' OR [Decision]='revision_requested' OR [Decision]='approved'))
GO

ALTER TABLE [dbo].[PageReviews] CHECK CONSTRAINT [CK_PageReviews_Decision]
GO

ALTER TABLE [dbo].[PageRegions]  WITH CHECK ADD  CONSTRAINT [CK_PageRegions_Status] CHECK  (([Status]='completed' OR [Status]='in_progress' OR [Status]='pending'))
GO

ALTER TABLE [dbo].[PageRegions] CHECK CONSTRAINT [CK_PageRegions_Status]
GO

ALTER TABLE [dbo].[PageRegions]  WITH CHECK ADD  CONSTRAINT [CK_PageRegions_Type] CHECK  (([Type]='lettering' OR [Type]='coloring' OR [Type]='text' OR [Type]='effects' OR [Type]='background' OR [Type]='line_art'))
GO

ALTER TABLE [dbo].[PageRegions] CHECK CONSTRAINT [CK_PageRegions_Type]
GO

ALTER TABLE [dbo].[PageAnnotations]  WITH CHECK ADD  CONSTRAINT [CK_PageAnnotations_Status] CHECK  (([Status]='resolved' OR [Status]='open'))
GO

ALTER TABLE [dbo].[PageAnnotations] CHECK CONSTRAINT [CK_PageAnnotations_Status]
GO

ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [CK_Tasks_Status] CHECK  (([Status]='cancelled' OR [Status]='approved' OR [Status]='revision' OR [Status]='submitted' OR [Status]='in_progress' OR [Status]='pending'))
GO

ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [CK_Tasks_Status]
GO

ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [CK_Tasks_Type] CHECK  (([Type]='review' OR [Type]='lettering' OR [Type]='coloring' OR [Type]='effects' OR [Type]='background' OR [Type]='line_art'))
GO

ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [CK_Tasks_Type]
GO

ALTER TABLE [dbo].[PayrollRecords]  WITH CHECK ADD  CONSTRAINT [CK_PayrollRecords_Status] CHECK  (([Status]='failed' OR [Status]='paid' OR [Status]='processing' OR [Status]='pending'))
GO

ALTER TABLE [dbo].[PayrollRecords] CHECK CONSTRAINT [CK_PayrollRecords_Status]
GO

ALTER TABLE [dbo].[TaskSubmissions]  WITH CHECK ADD  CONSTRAINT [CK_TaskSubmissions_Status] CHECK  (([Status]='rejected' OR [Status]='revision_requested' OR [Status]='accepted' OR [Status]='submitted'))
GO

ALTER TABLE [dbo].[TaskSubmissions] CHECK CONSTRAINT [CK_TaskSubmissions_Status]
GO


