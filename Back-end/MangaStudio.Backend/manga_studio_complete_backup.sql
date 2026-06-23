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

SET IDENTITY_INSERT [dbo].[Roles] ON 

GO

INSERT [dbo].[Roles] ([RoleId], [Code], [Name]) VALUES (1, N'mangaka', N'Mangaka')
GO

INSERT [dbo].[Roles] ([RoleId], [Code], [Name]) VALUES (2, N'assistant', N'Assistant')
GO

INSERT [dbo].[Roles] ([RoleId], [Code], [Name]) VALUES (3, N'tantou', N'Tantou Editor')
GO

INSERT [dbo].[Roles] ([RoleId], [Code], [Name]) VALUES (4, N'editorial', N'Editorial Board')
GO

SET IDENTITY_INSERT [dbo].[Roles] OFF
GO

INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'11111111-1111-1111-1111-111111111111', 1, N'Yuki Tanaka', N'yuki@mangaflow.com', N'AQAAAAIAAYagAAAAEJMK9LuqcEnRpAHgwyI6o3HMrTjZHw9G7dc9Gog91yj9q2gniAqraSxydrkZayTxbA==', N'yuki', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-01T12:32:29.0000000' AS DateTime2))
GO

INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'22222222-2222-2222-2222-222222222222', 2, N'Kenji Yamamoto', N'kenji@mangaflow.com', N'AQAAAAIAAYagAAAAEEGV2XSP8kaq2w+p6lkx3QFzYasM40Kauwc2PHlwpdhIkEQZ2i7uvLRrgdC8YFl/pA==', N'kenji', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-02T00:30:05.0000000' AS DateTime2))
GO

INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'33333333-3333-3333-3333-333333333333', 3, N'Sakura Ito', N'sakura@mangaflow.com', N'AQAAAAIAAYagAAAAEDqqbvyV7IA9jmQVKL15gIQ/3kqLE6bcNdfQ5gL8DnxZDcTJoJr1eczuZ8n1cFPdZg==', N'sakura', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-03T01:52:27.0000000' AS DateTime2))
GO

INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'44444444-4444-4444-4444-444444444444', 4, N'Takeshi Sato', N'takeshi@mangaflow.com', N'AQAAAAIAAYagAAAAEBizYk3S1VRHUnn0Q8rmArNNhvpx/77hCtD6wXuJOX1gf0pNlDkrr4z9I4GW0upYEw==', N'takeshi', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-10T02:10:14.0000000' AS DateTime2))
GO

INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'55555555-5555-5555-5555-555555555555', 2, N'Mei Chen', N'mei@mangaflow.com', NULL, N'mei', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[Series] ([SeriesId], [Title], [TitleJp], [Synopsis], [CoverImageUrl], [Status], [MangakaId], [TantouId], [Ranking], [ReaderCount], [Rating], [CancellationReason], [CreatedAt], [UpdatedAt]) VALUES (N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'Thám Tử Lừng Danh Conan 2026', N'Meitantei Conan 2026', N'Hành trình phá án mới của Conan', N'https://res.cloudinary.com/dzpxitrld/image/upload/v1782178143/MangaStudio/Covers/fyevns1yywimaxzy7tm9.webp', N'active', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', NULL, 0, NULL, NULL, CAST(N'2026-06-06T04:01:31.0000000' AS DateTime2), CAST(N'2026-06-23T01:29:03.0000000' AS DateTime2))
GO

INSERT [dbo].[Series] ([SeriesId], [Title], [TitleJp], [Synopsis], [CoverImageUrl], [Status], [MangakaId], [TantouId], [Ranking], [ReaderCount], [Rating], [CancellationReason], [CreatedAt], [UpdatedAt]) VALUES (N'a10b85cf-52b0-41a8-ac4c-4ef48c21d9f2', N'Avatar', N'', N'truyện hay nhất 2026', N'https://res.cloudinary.com/dzpxitrld/image/upload/v1782176045/MangaStudio/Covers/bumth4hpccthkhgdsptj.jpg', N'active', N'11111111-1111-1111-1111-111111111111', N'44444444-4444-4444-4444-444444444444', NULL, 0, NULL, NULL, CAST(N'2026-06-20T00:30:46.0000000' AS DateTime2), CAST(N'2026-06-23T00:54:06.0000000' AS DateTime2))
GO

INSERT [dbo].[Series] ([SeriesId], [Title], [TitleJp], [Synopsis], [CoverImageUrl], [Status], [MangakaId], [TantouId], [Ranking], [ReaderCount], [Rating], [CancellationReason], [CreatedAt], [UpdatedAt]) VALUES (N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'Dragon Hunters', NULL, N'Action fantasy manga series used for studio workflow tracking.', NULL, N'active', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', 3, 125000, CAST(4.80 AS Decimal(3, 2)), NULL, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-15T15:11:30.0000000' AS DateTime2))
GO

INSERT [dbo].[Series] ([SeriesId], [Title], [TitleJp], [Synopsis], [CoverImageUrl], [Status], [MangakaId], [TantouId], [Ranking], [ReaderCount], [Rating], [CancellationReason], [CreatedAt], [UpdatedAt]) VALUES (N'b0b654fb-0307-42b2-b950-d454f863ad32', N'Thủ Lĩnh Thẻ Bài', N'string', N'Sakura - Thủ Lĩnh Thẻ Bài là một loạt shōjo manga viết và minh họa bởi nhóm nghệ sĩ nổi tiếng Nhật Bản CLAMP', N'https://res.cloudinary.com/dzpxitrld/image/upload/v1782176268/MangaStudio/Covers/s9orkt53tqkkad2qxhtr.jpg', N'proposal', N'11111111-1111-1111-1111-111111111111', NULL, NULL, 0, NULL, NULL, CAST(N'2026-06-15T15:15:24.0000000' AS DateTime2), CAST(N'2026-06-23T00:57:48.0000000' AS DateTime2))
GO

INSERT [dbo].[Series] ([SeriesId], [Title], [TitleJp], [Synopsis], [CoverImageUrl], [Status], [MangakaId], [TantouId], [Ranking], [ReaderCount], [Rating], [CancellationReason], [CreatedAt], [UpdatedAt]) VALUES (N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'Kimetsu no Yaiba Test', N'鬼滅の刃テスト', N'A boy becomes a demon slayer to save his sister.', N'https://res.cloudinary.com/dzpxitrld/image/upload/v1782176289/MangaStudio/Covers/f0ofbkh1os23wezuvhsx.jpg', N'active', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', NULL, 0, NULL, NULL, CAST(N'2026-06-06T01:49:56.0000000' AS DateTime2), CAST(N'2026-06-23T00:58:09.0000000' AS DateTime2))
GO

INSERT [dbo].[Notifications] ([NotificationId], [UserId], [Type], [Title], [Message], [IsRead], [Link], [CreatedAt]) VALUES (N'ec100d90-c581-4552-89c1-363f1a43bd45', N'11111111-1111-1111-1111-111111111111', N'review_needed', N'Page review comment', N'Chapter 45 page 1 has a new annotation.', 1, N'/review', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[Notifications] ([NotificationId], [UserId], [Type], [Title], [Message], [IsRead], [Link], [CreatedAt]) VALUES (N'ca793b5f-8399-4625-8185-7bac1bf828a5', N'22222222-2222-2222-2222-222222222222', N'task_assigned', N'New task assigned', N'Background cleanup page 2 has been assigned to you.', 1, N'/tasks', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[AuditLogs] ([AuditLogId], [UserId], [Action], [EntityType], [EntityId], [DetailsJson], [CreatedAt]) VALUES (N'16d6d831-efc9-410e-abd0-7645e451e999', N'11111111-1111-1111-1111-111111111111', N'upload_pages', N'Chapter', N'cccccccc-cccc-cccc-cccc-cccccccccccc', N'{"pages":2}', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[AuditLogs] ([AuditLogId], [UserId], [Action], [EntityType], [EntityId], [DetailsJson], [CreatedAt]) VALUES (N'2070cfa1-4254-4a0a-ad8d-85bfe618bccc', N'44444444-4444-4444-4444-444444444444', N'approve_series', N'Series', N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'{"status":"approved"}', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[AssistantProfiles] ([AssistantId], [Specialty], [HourlyRate], [Rating]) VALUES (N'22222222-2222-2222-2222-222222222222', N'Backgrounds', CAST(18.00 AS Decimal(12, 2)), CAST(4.80 AS Decimal(3, 2)))
GO

INSERT [dbo].[AssistantProfiles] ([AssistantId], [Specialty], [HourlyRate], [Rating]) VALUES (N'55555555-5555-5555-5555-555555555555', N'Effects', CAST(15.00 AS Decimal(12, 2)), CAST(4.70 AS Decimal(3, 2)))
GO

INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'62cd78d2-887b-4701-b430-06f1e191b663', N'7f8071f6-997a-4d6b-981b-4968f321cfac', 3, N'chuyến đi du lịch tử thần', N'draft', NULL, NULL, CAST(N'2026-06-20T00:50:29.0000000' AS DateTime2), CAST(N'2026-06-20T00:50:29.0000000' AS DateTime2))
GO

INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 5720, N'Final Test Chapter 5720', N'draft', NULL, NULL, CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2), CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
GO

INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'6f2d3f6d-0afd-4ebc-9840-4935a6aca47c', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 999, N'Test Chapter', N'draft', NULL, NULL, CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2), CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2))
GO

INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'1958d9bc-2038-4554-9080-5c828a373f59', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 7322, N'Final Test Chapter 7322', N'draft', NULL, NULL, CAST(N'2026-06-06T03:09:03.0000000' AS DateTime2), CAST(N'2026-06-06T03:09:03.0000000' AS DateTime2))
GO

INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'a5e42258-9f06-462a-9794-60f5a22aaee6', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 5774, N'Final Test Chapter 5774', N'draft', NULL, NULL, CAST(N'2026-06-06T03:17:32.0000000' AS DateTime2), CAST(N'2026-06-06T03:17:32.0000000' AS DateTime2))
GO

INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'de7a28cc-524b-4579-b4f7-745c0475d593', N'7f8071f6-997a-4d6b-981b-4968f321cfac', 2, N'Án mạng ở sân ga', N'draft', CAST(N'2026-06-20' AS Date), NULL, CAST(N'2026-06-20T00:44:48.0000000' AS DateTime2), CAST(N'2026-06-20T00:44:48.0000000' AS DateTime2))
GO

INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'daf9b9e9-32cd-4d59-85d1-7b0c388f8dca', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 1, N'Cruelty', N'draft', CAST(N'2026-07-01' AS Date), NULL, CAST(N'2026-06-06T01:49:56.0000000' AS DateTime2), CAST(N'2026-06-06T01:49:56.0000000' AS DateTime2))
GO

INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'cccccccc-cccc-cccc-cccc-cccccccccccc', N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 45, N'The Final Battle', N'published', CAST(N'2026-06-05' AS Date), CAST(N'2026-06-21T17:25:27.0000000' AS DateTime2), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-21T17:25:27.0000000' AS DateTime2))
GO

INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'10383c7c-1dce-4564-828c-fca616b157c9', N'7f8071f6-997a-4d6b-981b-4968f321cfac', 1, N'Vụ án mạng trong phòng kín', N'draft', CAST(N'2026-07-20' AS Date), NULL, CAST(N'2026-06-06T04:15:49.0000000' AS DateTime2), CAST(N'2026-06-06T04:15:49.0000000' AS DateTime2))
GO

INSERT [dbo].[SeriesProposals] ([ProposalId], [SeriesId], [SubmittedById], [ReviewedById], [Status], [ReviewNote], [SubmittedAt], [ReviewedAt]) VALUES (N'106264bb-27dc-436e-bc40-32925ff8c38d', N'b0b654fb-0307-42b2-b950-d454f863ad32', N'11111111-1111-1111-1111-111111111111', NULL, N'submitted', NULL, CAST(N'2026-06-15T15:15:24.0000000' AS DateTime2), NULL)
GO

INSERT [dbo].[SeriesProposals] ([ProposalId], [SeriesId], [SubmittedById], [ReviewedById], [Status], [ReviewNote], [SubmittedAt], [ReviewedAt]) VALUES (N'4cbee752-96a8-4e20-a962-4876deaaf612', N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', N'approved', N'Ý tưởng phá án rất tốt, duyệt triển khai vẽ nháp!', CAST(N'2026-06-06T04:01:31.0000000' AS DateTime2), CAST(N'2026-06-06T04:08:11.0000000' AS DateTime2))
GO

INSERT [dbo].[SeriesProposals] ([ProposalId], [SeriesId], [SubmittedById], [ReviewedById], [Status], [ReviewNote], [SubmittedAt], [ReviewedAt]) VALUES (N'fe817a8b-5b6e-48e9-b2a7-96d00c3e28ad', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', N'approved', N'Truyện hay!', CAST(N'2026-06-06T01:49:56.0000000' AS DateTime2), CAST(N'2026-06-06T01:50:42.0000000' AS DateTime2))
GO

INSERT [dbo].[SeriesProposals] ([ProposalId], [SeriesId], [SubmittedById], [ReviewedById], [Status], [ReviewNote], [SubmittedAt], [ReviewedAt]) VALUES (N'01db361c-9801-4591-9751-9f44cb35eca3', N'a10b85cf-52b0-41a8-ac4c-4ef48c21d9f2', N'11111111-1111-1111-1111-111111111111', N'44444444-4444-4444-4444-444444444444', N'approved', N'Excellent romance and mystery concept, approved for full publication.', CAST(N'2026-06-20T00:30:46.0000000' AS DateTime2), CAST(N'2026-06-21T17:14:04.0000000' AS DateTime2))
GO

INSERT [dbo].[SeriesProposals] ([ProposalId], [SeriesId], [SubmittedById], [ReviewedById], [Status], [ReviewNote], [SubmittedAt], [ReviewedAt]) VALUES (N'd8774026-55bb-4178-955d-c1b302dae57b', N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'11111111-1111-1111-1111-111111111111', N'44444444-4444-4444-4444-444444444444', N'approved', N'Approved for regular publication.', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'Action')
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'Detective')
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'Mystery')
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'a10b85cf-52b0-41a8-ac4c-4ef48c21d9f2', N'Fantasy')
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'Action')
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'Fantasy')
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'b0b654fb-0307-42b2-b950-d454f863ad32', N'Fantasy')
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'Action')
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'Drama')
GO

INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'Fantasy')
GO

INSERT [dbo].[ReaderVotes] ([ReaderVoteId], [SeriesId], [WeekNumber], [YearNumber], [Votes], [RankNumber], [CreatedAt]) VALUES (N'f2498bbb-a6f3-4b43-8738-1ed53d91f543', N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 20, 2026, 2250, 3, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[PublishSchedules] ([PublishScheduleId], [ChapterId], [ScheduledDate], [Status], [ApprovedById], [PublishedAt], [CreatedAt]) VALUES (N'f455eb78-77b4-4096-9421-29e8bd3dbc89', N'cccccccc-cccc-cccc-cccc-cccccccccccc', CAST(N'2026-06-10T09:00:00.0000000' AS DateTime2), N'published', N'44444444-4444-4444-4444-444444444444', CAST(N'2026-06-21T17:25:27.0000000' AS DateTime2), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'20fcc7ca-44ba-4cf6-a51a-0345ea4aa7e4', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 23, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-12T01:51:41.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'4b0e707e-35a7-4955-975b-0f35d5aa147c', N'10383c7c-1dce-4564-828c-fca616b157c9', 1, NULL, N'revision', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-20T16:50:31.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'faa54688-13b7-43d1-959f-113901cb3156', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 12, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'acc80f8f-630a-4c46-9047-1d9ead6e89e4', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, NULL, N'pending', NULL, CAST(N'2026-06-02T00:02:11.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'8ca35e76-90a1-4b0b-8a7d-272eb81b4437', N'de7a28cc-524b-4579-b4f7-745c0475d593', 1, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-20T16:50:03.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'57f8a2d8-adaf-4afd-bd58-3c79b9438ab5', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 3, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 1, NULL, N'approved', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'dabe8e8a-0088-4e61-850c-44efc1309228', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 22, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-07T14:14:17.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'415bfc43-f200-40ae-90de-4c1b0f8f191c', N'1958d9bc-2038-4554-9080-5c828a373f59', 4, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'4f74b3b3-47e3-4805-aede-4d318b03fcbc', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 3, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'9d6f6bd4-061e-45de-8c50-50490a9c9b00', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 24, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-20T00:05:26.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'5fc8aa2c-1ebf-4d93-87e8-54ef7a8fe1e2', N'1958d9bc-2038-4554-9080-5c828a373f59', 2, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'5da13b7b-180b-4727-ba3a-566ca14a87cc', N'1958d9bc-2038-4554-9080-5c828a373f59', 3, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'56cfa8bd-a6db-4b11-961f-5c3915e426c2', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 9, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:05:20.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'd2eea4ed-d0d9-4532-811e-64bdbfbc37d8', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 19, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'9eb8b692-d401-4a65-a908-6cc2e37dd92d', N'6f2d3f6d-0afd-4ebc-9840-4935a6aca47c', 2, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'255a21b0-6344-4547-a1b0-79a6a93dda7e', N'1958d9bc-2038-4554-9080-5c828a373f59', 1, NULL, N'approved', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'0a7137d7-bee6-480c-9e9d-79cbc1ef95a1', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 13, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'35da7d5f-6059-483b-bfaa-834985546a19', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 5, NULL, N'pending', NULL, CAST(N'2026-06-02T23:51:00.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'622559de-1402-42c4-b896-8674976b4b7e', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 4, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'4922a65f-0ca0-491c-911d-8be19977be4d', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 18, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'06bd0581-c0ec-496d-a1fb-8cc7d5c65393', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 7, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T00:55:29.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'1e8ca607-21ad-4371-8dce-8f17d7f3315c', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 16, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'83823f6a-1200-4952-8063-8f375def87e6', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, NULL, N'pending', NULL, CAST(N'2026-06-02T00:26:17.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'389f4d17-111c-459a-a64a-95dff7f88e1b', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 8, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:02:08.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'b56e6559-c1b4-4c12-a9e4-a8d5d48ba28c', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 21, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'e38f1826-a5fa-494e-aa75-b20e4bc406d5', N'6f2d3f6d-0afd-4ebc-9840-4935a6aca47c', 1, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'b1fd0a70-01b7-4872-9282-b4ec3de7abd2', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 2, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'107acb27-4b31-42e9-9fb9-b546bf26535c', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 17, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'fc0ffe41-3ad8-4586-8abb-b945ddf7b075', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 11, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:23:01.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'9e29ab9c-3164-4739-9a05-b98a561ce1f4', N'1958d9bc-2038-4554-9080-5c828a373f59', 5, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'987076c2-86e0-49bc-8182-c6e341c19b65', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 1, NULL, N'approved', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:33.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'fd4d69e8-8933-4ae6-90a0-d67f5b856dc6', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 5, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'e753b24a-fb81-4825-a39d-d86e4ec8b13f', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 20, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'64053eaf-8917-441b-b4f6-dadb764ed697', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 6, NULL, N'pending', NULL, CAST(N'2026-06-06T00:44:21.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'd04f8db0-3b17-4119-8d76-df552be85144', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 2, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'fc74cad8-cc33-4caa-8129-e139d7c10035', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 14, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, NULL, N'revision', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'39460828-0726-4d30-b63d-f3ee8d4ce438', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 15, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'b0afa419-9cf7-4919-9583-f657e32527c8', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 10, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:11:19.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'3346e595-6440-442f-91b9-f7365409f809', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 4, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'527b82a2-77ec-48f9-a995-fc39fb1cd2e9', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 5, NULL, N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
GO

INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'ffffffff-ffff-ffff-ffff-ffffffffffff', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, NULL, N'revision', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'20c7880e-bd5d-471a-8da7-00fb5bab11fd', N'4f74b3b3-47e3-4805-aede-4d318b03fcbc', 1, N'', N'page3.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'46c86084-d692-431b-bfe8-1b61d12d2b5d', N'd04f8db0-3b17-4119-8d76-df552be85144', 1, N'', N'page2.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'025a7c8f-dbb9-4d40-b88b-24f1434b7290', N'5fc8aa2c-1ebf-4d93-87e8-54ef7a8fe1e2', 1, N'', N'page2.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'5c3c688b-f95a-4e47-9e2b-2b6b39b0402b', N'255a21b0-6344-4547-a1b0-79a6a93dda7e', 1, N'', N'page1.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'd38c0382-e967-4ac3-ad00-2f3d47bbf35f', N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, N'', N'page_001.png', 2516582, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), N'Initial upload')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'3515cf3f-e803-414e-ac5d-34471a0cfd46', N'ffffffff-ffff-ffff-ffff-ffffffffffff', 2, N'', N'Cardcaptor_Sakura_vol1_cover.jpg', 56096, N'image/jpeg', N'22222222-2222-2222-2222-222222222222', CAST(N'2026-06-20T00:01:44.0000000' AS DateTime2), N'Nộp sản phẩm cho công việc: Background cleanup page 2')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'a00c367c-8dac-44fa-a797-39fa0f2d323e', N'fd4d69e8-8933-4ae6-90a0-d67f5b856dc6', 1, N'', N'page5.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'f1988488-84fb-454e-b371-3a513e520882', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', 2, N'', N'Cardcaptor_Sakura_vol1_cover.jpg', 56096, N'image/jpeg', N'22222222-2222-2222-2222-222222222222', CAST(N'2026-06-20T16:31:34.0000000' AS DateTime2), N'Nộp sản phẩm cho công việc: Tô màu trang 1')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'df0cc51b-aaab-4eb3-a2b4-49f17a13b2c3', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', 3, N'', N'Cardcaptor_Sakura_vol1_cover.jpg', 56096, N'image/jpeg', N'22222222-2222-2222-2222-222222222222', CAST(N'2026-06-20T16:34:26.0000000' AS DateTime2), N'Nộp sản phẩm cho công việc: Tô màu trang 1')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'4c525627-5146-46b9-8681-5746f7b9f773', N'4b0e707e-35a7-4955-975b-0f35d5aa147c', 1, N'', N'0f40da56-d763-4c6e-973f-09bac21fc13c.jpg', 56096, N'image/jpeg', N'22222222-2222-2222-2222-222222222222', CAST(N'2026-06-20T16:52:53.0000000' AS DateTime2), N'Nộp sản phẩm cho công việc: vễ')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'14d62099-75da-414d-b3ef-68d167807f86', N'5da13b7b-180b-4727-ba3a-566ca14a87cc', 1, N'', N'page3.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'e6e3fed7-b0ea-410d-b59d-7ac43cd69d9c', N'9e29ab9c-3164-4739-9a05-b98a561ce1f4', 1, N'', N'page5.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'038be384-cfb4-43c6-a822-9f8c108eeec8', N'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, N'', N'page_002.png', 2202009, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), N'Initial upload')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'ae60a85c-f81e-4da1-a7d0-c00c641fdd8e', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', 4, N'', N'Screenshot 2026-06-08 114415.png', 2504362, N'image/png', N'22222222-2222-2222-2222-222222222222', CAST(N'2026-06-20T16:37:46.0000000' AS DateTime2), N'Nộp sản phẩm cho công việc: Tô màu trang 1')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'a5e98524-9648-481f-bc54-d8fe0e9cdeaf', N'987076c2-86e0-49bc-8182-c6e341c19b65', 1, N'', N'page1.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:33.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'ff9af6a8-372b-49b9-814a-f0f80cbac42b', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', 1, N'', N'Cardcaptor_Sakura_vol1_cover.jpg', 56096, N'image/jpeg', N'22222222-2222-2222-2222-222222222222', CAST(N'2026-06-20T16:23:42.0000000' AS DateTime2), N'Nộp sản phẩm cho công việc: Tô màu trang 1')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'7cf7597c-799b-4f03-9b0f-f303bfbc11e7', N'415bfc43-f200-40ae-90de-4c1b0f8f191c', 1, N'', N'page4.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'bdc5db08-d3a6-4469-b6ea-f55d3ce305c4', N'3346e595-6440-442f-91b9-f7365409f809', 1, N'', N'page4.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), N'Tải lên trang ban đầu')
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'377a9355-89b7-4d0b-bc08-16a9fc0b3397', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'11111111-1111-1111-1111-111111111111', N'revision_requested', N'Revision requested', CAST(N'2026-06-20T16:33:13.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'1c315f2c-1c5f-44c1-add5-4385d7a8fa68', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'11111111-1111-1111-1111-111111111111', N'revision_requested', N'Revision requested', CAST(N'2026-06-20T16:34:58.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'8bd9fa0c-9ed0-4151-9b36-4626419def23', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'33333333-3333-3333-3333-333333333333', N'approved', N'Trang vẽ đẹp, được duyệt!', CAST(N'2026-06-06T01:52:16.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'74b5a08a-9e0d-49e7-8223-49bed7ed503c', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'11111111-1111-1111-1111-111111111111', N'revision_requested', N'Revision requested', CAST(N'2026-06-20T16:33:02.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'b6e8df3f-54ab-45bd-a486-4df081d1d980', N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', N'11111111-1111-1111-1111-111111111111', N'revision_requested', N'Revision requested', CAST(N'2026-06-20T16:33:50.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'be03be98-e64c-4332-bcb8-5225674caef7', N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', N'11111111-1111-1111-1111-111111111111', N'revision_requested', N'Revision requested', CAST(N'2026-06-20T16:33:53.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'a4ad4a36-b3a2-4963-9e46-75d2a5c448e9', N'4b0e707e-35a7-4955-975b-0f35d5aa147c', N'11111111-1111-1111-1111-111111111111', N'revision_requested', N'Revision requested', CAST(N'2026-06-20T16:53:12.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'b4df7ccd-2183-4beb-ab1b-7966d897891a', N'255a21b0-6344-4547-a1b0-79a6a93dda7e', N'33333333-3333-3333-3333-333333333333', N'approved', NULL, CAST(N'2026-06-06T03:09:08.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'6b2922f2-ef7c-49ff-8eca-7f5c643efc3b', N'987076c2-86e0-49bc-8182-c6e341c19b65', N'33333333-3333-3333-3333-333333333333', N'approved', NULL, CAST(N'2026-06-06T03:17:37.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'002fb089-9332-4c5f-a810-9b68b85095c5', N'ffffffff-ffff-ffff-ffff-ffffffffffff', N'11111111-1111-1111-1111-111111111111', N'revision_requested', N'Revision requested', CAST(N'2026-06-20T16:32:12.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'266c8b4a-afe1-4f46-bb17-f0f819f6cf63', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'11111111-1111-1111-1111-111111111111', N'revision_requested', N'Revision requested', CAST(N'2026-06-20T16:33:05.0000000' AS DateTime2))
GO

INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'30c51d17-e13c-4fb1-ba1d-fc546c7e3f93', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'11111111-1111-1111-1111-111111111111', N'approved', N'Page approved', CAST(N'2026-06-20T16:38:00.0000000' AS DateTime2))
GO

INSERT [dbo].[PageRegions] ([RegionId], [PageId], [Type], [X], [Y], [Width], [Height], [AssignedToId], [Status], [CreatedAt]) VALUES (N'12121212-1212-1212-1212-121212121212', N'ffffffff-ffff-ffff-ffff-ffffffffffff', N'background', CAST(0.00 AS Decimal(9, 2)), CAST(0.00 AS Decimal(9, 2)), CAST(800.00 AS Decimal(9, 2)), CAST(1200.00 AS Decimal(9, 2)), N'22222222-2222-2222-2222-222222222222', N'in_progress', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'8a2c0dde-7e94-4aa8-bcf2-17ef682f5f2d', N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', N'33333333-3333-3333-3333-333333333333', CAST(180.00 AS Decimal(9, 2)), CAST(260.00 AS Decimal(9, 2)), CAST(120.00 AS Decimal(9, 2)), CAST(80.00 AS Decimal(9, 2)), N'Adjust panel transition before approval.', N'open', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), NULL)
GO

INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'4b76f285-edaf-4876-8fe4-597d1231fc0d', N'987076c2-86e0-49bc-8182-c6e341c19b65', N'11111111-1111-1111-1111-111111111111', CAST(50.50 AS Decimal(9, 2)), CAST(100.25 AS Decimal(9, 2)), CAST(200.00 AS Decimal(9, 2)), CAST(150.00 AS Decimal(9, 2)), N'Cần vẽ lại nét mực', N'open', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), NULL)
GO

INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'e567d5f2-75b5-413b-b2c5-632034b6994c', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'11111111-1111-1111-1111-111111111111', CAST(45.33 AS Decimal(9, 2)), CAST(36.84 AS Decimal(9, 2)), NULL, NULL, N'chỉnh lại màu', N'open', CAST(N'2026-06-20T16:34:57.0000000' AS DateTime2), NULL)
GO

INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'f8abce85-05e3-4a00-be1e-68e03b1d3d2f', N'e38f1826-a5fa-494e-aa75-b20e4bc406d5', N'11111111-1111-1111-1111-111111111111', CAST(100.00 AS Decimal(9, 2)), CAST(200.00 AS Decimal(9, 2)), CAST(50.00 AS Decimal(9, 2)), CAST(30.00 AS Decimal(9, 2)), N'Tô màu đậm hơn ở đây', N'open', CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2), NULL)
GO

INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'b8a535e3-0cdf-4cec-9d87-9238a50c7703', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'11111111-1111-1111-1111-111111111111', CAST(51.50 AS Decimal(9, 2)), CAST(43.42 AS Decimal(9, 2)), NULL, NULL, N'fazed', N'open', CAST(N'2026-06-20T16:33:11.0000000' AS DateTime2), NULL)
GO

INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'7d02e924-379a-4132-bd51-c57a3047c468', N'255a21b0-6344-4547-a1b0-79a6a93dda7e', N'11111111-1111-1111-1111-111111111111', CAST(50.50 AS Decimal(9, 2)), CAST(100.25 AS Decimal(9, 2)), CAST(200.00 AS Decimal(9, 2)), CAST(150.00 AS Decimal(9, 2)), N'Cần vẽ lại nét mực', N'open', CAST(N'2026-06-06T03:09:06.0000000' AS DateTime2), NULL)
GO

INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'c7166a25-8923-4a16-89ce-e82286a7fa0c', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'11111111-1111-1111-1111-111111111111', CAST(50.50 AS Decimal(9, 2)), CAST(100.25 AS Decimal(9, 2)), CAST(200.00 AS Decimal(9, 2)), CAST(150.00 AS Decimal(9, 2)), N'Cần vẽ lại nét mực', N'open', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2), NULL)
GO

INSERT [dbo].[ReviewComments] ([CommentId], [PageId], [UserId], [Body], [CreatedAt]) VALUES (N'c33d0796-1ca5-48d0-a0ff-cc137b031267', N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', N'33333333-3333-3333-3333-333333333333', N'The panel transitions look good. One small fix remains.', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'13131313-1313-1313-1313-131313131313', N'Background cleanup page 2', N'Clean and finish background region.', N'background', N'ffffffff-ffff-ffff-ffff-ffffffffffff', N'12121212-1212-1212-1212-121212121212', N'22222222-2222-2222-2222-222222222222', N'11111111-1111-1111-1111-111111111111', N'submitted', CAST(N'2026-05-30' AS Date), CAST(180.00 AS Decimal(12, 2)), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-20T00:01:44.0000000' AS DateTime2))
GO

INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'6137b686-2b01-45fe-9eb8-1d909e4c89b2', N'vễ', NULL, N'coloring', N'4b0e707e-35a7-4955-975b-0f35d5aa147c', NULL, N'22222222-2222-2222-2222-222222222222', N'11111111-1111-1111-1111-111111111111', N'revision', NULL, CAST(0.00 AS Decimal(12, 2)), CAST(N'2026-06-20T16:52:17.0000000' AS DateTime2), CAST(N'2026-06-20T16:53:12.0000000' AS DateTime2))
GO

INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'7d47f692-e741-49bb-9117-78c6d8687ff0', N'Tô màu trang 1', N'Tô màu theo bảng màu đã được duyệt, đảm bảo chi tiết', N'coloring', N'987076c2-86e0-49bc-8182-c6e341c19b65', NULL, NULL, N'11111111-1111-1111-1111-111111111111', N'pending', CAST(N'2026-07-30' AS Date), CAST(150000.00 AS Decimal(12, 2)), CAST(N'2026-06-06T03:17:35.0000000' AS DateTime2), CAST(N'2026-06-06T03:17:35.0000000' AS DateTime2))
GO

INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'4165d884-bc58-4d84-a817-7a6a4f12e51d', N'vẽ màu', NULL, N'coloring', N'4b0e707e-35a7-4955-975b-0f35d5aa147c', NULL, NULL, N'11111111-1111-1111-1111-111111111111', N'cancelled', NULL, CAST(0.00 AS Decimal(12, 2)), CAST(N'2026-06-20T16:51:16.0000000' AS DateTime2), CAST(N'2026-06-21T18:12:12.0000000' AS DateTime2))
GO

INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'7218c022-103c-4436-aef9-7e18fe109af0', N'Tô màu trang 1', N'Tô màu theo bảng màu đã được duyệt, đảm bảo chi tiết', N'coloring', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', NULL, N'22222222-2222-2222-2222-222222222222', N'11111111-1111-1111-1111-111111111111', N'submitted', CAST(N'2026-07-30' AS Date), CAST(150000.00 AS Decimal(12, 2)), CAST(N'2026-06-06T01:52:16.0000000' AS DateTime2), CAST(N'2026-06-20T16:37:46.0000000' AS DateTime2))
GO

INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'd0d99ce6-0205-4d75-b476-e1e8d9d2bc37', N'Tô màu trang 1', N'Tô màu theo bảng màu đã được duyệt, đảm bảo chi tiết', N'coloring', N'255a21b0-6344-4547-a1b0-79a6a93dda7e', NULL, NULL, N'11111111-1111-1111-1111-111111111111', N'pending', CAST(N'2026-07-30' AS Date), CAST(150000.00 AS Decimal(12, 2)), CAST(N'2026-06-06T03:09:06.0000000' AS DateTime2), CAST(N'2026-06-06T03:09:06.0000000' AS DateTime2))
GO

INSERT [dbo].[PayrollRecords] ([PayrollRecordId], [AssistantId], [TaskId], [PeriodStart], [PeriodEnd], [BaseAmount], [BonusAmount], [DeductionAmount], [Status], [PaidAt], [CreatedAt]) VALUES (N'b4416366-0190-46e3-adea-53ae108ef109', N'22222222-2222-2222-2222-222222222222', N'13131313-1313-1313-1313-131313131313', CAST(N'2026-05-16' AS Date), CAST(N'2026-05-31' AS Date), CAST(180.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), N'pending', NULL, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
GO

INSERT [dbo].[TaskSubmissions] ([SubmissionId], [TaskId], [SubmittedById], [PageVersionId], [Note], [Status], [SubmittedAt]) VALUES (N'06fd4f9e-c630-45eb-a6f4-10eb600c0d4e', N'7218c022-103c-4436-aef9-7e18fe109af0', N'22222222-2222-2222-2222-222222222222', N'ae60a85c-f81e-4da1-a7d0-c00c641fdd8e', NULL, N'submitted', CAST(N'2026-06-20T16:37:46.0000000' AS DateTime2))
GO

INSERT [dbo].[TaskSubmissions] ([SubmissionId], [TaskId], [SubmittedById], [PageVersionId], [Note], [Status], [SubmittedAt]) VALUES (N'128d7524-7c1a-4a75-aae0-5f9a0a72f3c2', N'7218c022-103c-4436-aef9-7e18fe109af0', N'22222222-2222-2222-2222-222222222222', N'f1988488-84fb-454e-b371-3a513e520882', NULL, N'submitted', CAST(N'2026-06-20T16:31:34.0000000' AS DateTime2))
GO

INSERT [dbo].[TaskSubmissions] ([SubmissionId], [TaskId], [SubmittedById], [PageVersionId], [Note], [Status], [SubmittedAt]) VALUES (N'a2413c21-eaca-41da-b378-67a270b82e77', N'6137b686-2b01-45fe-9eb8-1d909e4c89b2', N'22222222-2222-2222-2222-222222222222', N'4c525627-5146-46b9-8681-5746f7b9f773', NULL, N'submitted', CAST(N'2026-06-20T16:52:53.0000000' AS DateTime2))
GO

INSERT [dbo].[TaskSubmissions] ([SubmissionId], [TaskId], [SubmittedById], [PageVersionId], [Note], [Status], [SubmittedAt]) VALUES (N'4d55fdda-8dab-466e-ae9a-6c30e37bae3d', N'13131313-1313-1313-1313-131313131313', N'22222222-2222-2222-2222-222222222222', N'3515cf3f-e803-414e-ac5d-34471a0cfd46', NULL, N'submitted', CAST(N'2026-06-20T00:01:44.0000000' AS DateTime2))
GO

INSERT [dbo].[TaskSubmissions] ([SubmissionId], [TaskId], [SubmittedById], [PageVersionId], [Note], [Status], [SubmittedAt]) VALUES (N'7b4a88bb-6cef-401f-871b-df0f63a4affa', N'7218c022-103c-4436-aef9-7e18fe109af0', N'22222222-2222-2222-2222-222222222222', N'ff9af6a8-372b-49b9-814a-f0f80cbac42b', NULL, N'submitted', CAST(N'2026-06-20T16:23:42.0000000' AS DateTime2))
GO

INSERT [dbo].[TaskSubmissions] ([SubmissionId], [TaskId], [SubmittedById], [PageVersionId], [Note], [Status], [SubmittedAt]) VALUES (N'29ccd90b-3af5-404a-9c36-eb984c2d4682', N'7218c022-103c-4436-aef9-7e18fe109af0', N'22222222-2222-2222-2222-222222222222', N'df0cc51b-aaab-4eb3-a2b4-49f17a13b2c3', NULL, N'submitted', CAST(N'2026-06-20T16:34:26.0000000' AS DateTime2))
GO

SET ANSI_PADDING ON

GO

ALTER TABLE [dbo].[Roles] ADD  CONSTRAINT [UQ_Roles_Code] UNIQUE NONCLUSTERED 
(
	[Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [UQ_Users_Email] UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
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

ALTER TABLE [dbo].[Chapters] ADD  CONSTRAINT [UQ_Chapters_Series_Number] UNIQUE NONCLUSTERED 
(
	[SeriesId] ASC,
	[ChapterNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

CREATE NONCLUSTERED INDEX [IX_Chapters_SeriesId_Status] ON [dbo].[Chapters]
(
	[SeriesId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

ALTER TABLE [dbo].[ReaderVotes] ADD  CONSTRAINT [UQ_ReaderVotes_Series_Week] UNIQUE NONCLUSTERED 
(
	[SeriesId] ASC,
	[WeekNumber] ASC,
	[YearNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_ReaderVotes_Week_Rank] ON [dbo].[ReaderVotes]
(
	[YearNumber] ASC,
	[WeekNumber] ASC,
	[RankNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

ALTER TABLE [dbo].[MangaPages] ADD  CONSTRAINT [UQ_MangaPages_Chapter_PageNumber] UNIQUE NONCLUSTERED 
(
	[ChapterId] ASC,
	[PageNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

SET ANSI_PADDING ON

GO

CREATE NONCLUSTERED INDEX [IX_MangaPages_ChapterId_Status] ON [dbo].[MangaPages]
(
	[ChapterId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

ALTER TABLE [dbo].[PageVersions] ADD  CONSTRAINT [UQ_PageVersions_Page_Version] UNIQUE NONCLUSTERED 
(
	[PageId] ASC,
	[VersionNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
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


