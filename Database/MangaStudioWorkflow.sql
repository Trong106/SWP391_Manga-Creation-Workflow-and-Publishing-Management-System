SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
CREATE TABLE [dbo].[Roles](
	[RoleId] [int] IDENTITY(1,1) NOT NULL,
	[Code] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Name] [nvarchar](80) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED 
(
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
CREATE TABLE [dbo].[SeriesGenres](
	[SeriesId] [uniqueidentifier] NOT NULL,
	[Genre] [nvarchar](80) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK_SeriesGenres] PRIMARY KEY CLUSTERED 
(
	[SeriesId] ASC,
	[Genre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
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

SET IDENTITY_INSERT [dbo].[Roles] ON 

INSERT [dbo].[Roles] ([RoleId], [Code], [Name]) VALUES (1, N'mangaka', N'Mangaka')
INSERT [dbo].[Roles] ([RoleId], [Code], [Name]) VALUES (2, N'assistant', N'Assistant')
INSERT [dbo].[Roles] ([RoleId], [Code], [Name]) VALUES (3, N'tantou', N'Tantou Editor')
INSERT [dbo].[Roles] ([RoleId], [Code], [Name]) VALUES (4, N'editorial', N'Editorial Board')
SET IDENTITY_INSERT [dbo].[Roles] OFF
INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'11111111-1111-1111-1111-111111111111', 1, N'Yuki Tanaka', N'yuki@mangaflow.com', N'AQAAAAIAAYagAAAAEJMK9LuqcEnRpAHgwyI6o3HMrTjZHw9G7dc9Gog91yj9q2gniAqraSxydrkZayTxbA==', N'yuki', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-01T12:32:29.0000000' AS DateTime2))
INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'22222222-2222-2222-2222-222222222222', 2, N'Kenji Yamamoto', N'kenji@mangaflow.com', N'AQAAAAIAAYagAAAAEEGV2XSP8kaq2w+p6lkx3QFzYasM40Kauwc2PHlwpdhIkEQZ2i7uvLRrgdC8YFl/pA==', N'kenji', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-02T00:30:05.0000000' AS DateTime2))
INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'33333333-3333-3333-3333-333333333333', 3, N'Sakura Ito', N'sakura@mangaflow.com', N'AQAAAAIAAYagAAAAEDqqbvyV7IA9jmQVKL15gIQ/3kqLE6bcNdfQ5gL8DnxZDcTJoJr1eczuZ8n1cFPdZg==', N'sakura', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-03T01:52:27.0000000' AS DateTime2))
INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'44444444-4444-4444-4444-444444444444', 4, N'Takeshi Sato', N'takeshi@mangaflow.com', N'AQAAAAIAAYagAAAAEBizYk3S1VRHUnn0Q8rmArNNhvpx/77hCtD6wXuJOX1gf0pNlDkrr4z9I4GW0upYEw==', N'takeshi', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-10T02:10:14.0000000' AS DateTime2))
INSERT [dbo].[Users] ([UserId], [RoleId], [FullName], [Email], [PasswordHash], [Avatar], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (N'55555555-5555-5555-5555-555555555555', 2, N'Mei Chen', N'mei@mangaflow.com', NULL, N'mei', 1, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[Series] ([SeriesId], [Title], [TitleJp], [Synopsis], [CoverImageUrl], [Status], [MangakaId], [TantouId], [Ranking], [ReaderCount], [Rating], [CancellationReason], [CreatedAt], [UpdatedAt]) VALUES (N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'Thám Tử Lừng Danh Conan 2026', N'Meitantei Conan 2026', N'Hành trình phá án mới của Conan', N'/Uploads/b859dee6-3067-4dce-b8d1-bff0ff0af3aa.webp', N'active', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', NULL, 0, NULL, NULL, CAST(N'2026-06-06T04:01:31.0000000' AS DateTime2), CAST(N'2026-06-11T17:16:33.0000000' AS DateTime2))
INSERT [dbo].[Series] ([SeriesId], [Title], [TitleJp], [Synopsis], [CoverImageUrl], [Status], [MangakaId], [TantouId], [Ranking], [ReaderCount], [Rating], [CancellationReason], [CreatedAt], [UpdatedAt]) VALUES (N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'Dragon Hunters', NULL, N'Action fantasy manga series used for studio workflow tracking.', N'/Uploads/42a6d4fd-da99-4f23-8552-38a8b679219e.jpg', N'active', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', 3, 125000, CAST(4.80 AS Decimal(3, 2)), NULL, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-15T15:11:30.0000000' AS DateTime2))
INSERT [dbo].[Series] ([SeriesId], [Title], [TitleJp], [Synopsis], [CoverImageUrl], [Status], [MangakaId], [TantouId], [Ranking], [ReaderCount], [Rating], [CancellationReason], [CreatedAt], [UpdatedAt]) VALUES (N'b0b654fb-0307-42b2-b950-d454f863ad32', N'Thủ Lĩnh Thẻ Bài', N'string', N'Sakura - Thủ Lĩnh Thẻ Bài là một loạt shōjo manga viết và minh họa bởi nhóm nghệ sĩ nổi tiếng Nhật Bản CLAMP', N'/Uploads/0f40da56-d763-4c6e-973f-09bac21fc13c.jpg', N'proposal', N'11111111-1111-1111-1111-111111111111', NULL, NULL, 0, NULL, NULL, CAST(N'2026-06-15T15:15:24.0000000' AS DateTime2), CAST(N'2026-06-15T15:26:07.0000000' AS DateTime2))
INSERT [dbo].[Series] ([SeriesId], [Title], [TitleJp], [Synopsis], [CoverImageUrl], [Status], [MangakaId], [TantouId], [Ranking], [ReaderCount], [Rating], [CancellationReason], [CreatedAt], [UpdatedAt]) VALUES (N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'Kimetsu no Yaiba Test', N'鬼滅の刃テスト', N'A boy becomes a demon slayer to save his sister.', N'/Uploads/cec06923-8f71-4a81-a548-32c849a521bf.jpg', N'active', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', NULL, 0, NULL, NULL, CAST(N'2026-06-06T01:49:56.0000000' AS DateTime2), CAST(N'2026-06-12T02:38:49.0000000' AS DateTime2))
INSERT [dbo].[Notifications] ([NotificationId], [UserId], [Type], [Title], [Message], [IsRead], [Link], [CreatedAt]) VALUES (N'ec100d90-c581-4552-89c1-363f1a43bd45', N'11111111-1111-1111-1111-111111111111', N'review_needed', N'Page review comment', N'Chapter 45 page 1 has a new annotation.', 0, N'/review', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[Notifications] ([NotificationId], [UserId], [Type], [Title], [Message], [IsRead], [Link], [CreatedAt]) VALUES (N'ca793b5f-8399-4625-8185-7bac1bf828a5', N'22222222-2222-2222-2222-222222222222', N'task_assigned', N'New task assigned', N'Background cleanup page 2 has been assigned to you.', 0, N'/tasks', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[AuditLogs] ([AuditLogId], [UserId], [Action], [EntityType], [EntityId], [DetailsJson], [CreatedAt]) VALUES (N'16d6d831-efc9-410e-abd0-7645e451e999', N'11111111-1111-1111-1111-111111111111', N'upload_pages', N'Chapter', N'cccccccc-cccc-cccc-cccc-cccccccccccc', N'{"pages":2}', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[AuditLogs] ([AuditLogId], [UserId], [Action], [EntityType], [EntityId], [DetailsJson], [CreatedAt]) VALUES (N'2070cfa1-4254-4a0a-ad8d-85bfe618bccc', N'44444444-4444-4444-4444-444444444444', N'approve_series', N'Series', N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'{"status":"approved"}', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[AssistantProfiles] ([AssistantId], [Specialty], [HourlyRate], [Rating]) VALUES (N'22222222-2222-2222-2222-222222222222', N'Backgrounds', CAST(18.00 AS Decimal(12, 2)), CAST(4.80 AS Decimal(3, 2)))
INSERT [dbo].[AssistantProfiles] ([AssistantId], [Specialty], [HourlyRate], [Rating]) VALUES (N'55555555-5555-5555-5555-555555555555', N'Effects', CAST(15.00 AS Decimal(12, 2)), CAST(4.70 AS Decimal(3, 2)))
INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 5720, N'Final Test Chapter 5720', N'draft', NULL, NULL, CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2), CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'6f2d3f6d-0afd-4ebc-9840-4935a6aca47c', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 999, N'Test Chapter', N'draft', NULL, NULL, CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2), CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2))
INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'1958d9bc-2038-4554-9080-5c828a373f59', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 7322, N'Final Test Chapter 7322', N'draft', NULL, NULL, CAST(N'2026-06-06T03:09:03.0000000' AS DateTime2), CAST(N'2026-06-06T03:09:03.0000000' AS DateTime2))
INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'a5e42258-9f06-462a-9794-60f5a22aaee6', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 5774, N'Final Test Chapter 5774', N'draft', NULL, NULL, CAST(N'2026-06-06T03:17:32.0000000' AS DateTime2), CAST(N'2026-06-06T03:17:32.0000000' AS DateTime2))
INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'daf9b9e9-32cd-4d59-85d1-7b0c388f8dca', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', 1, N'Cruelty', N'draft', CAST(N'2026-07-01' AS Date), NULL, CAST(N'2026-06-06T01:49:56.0000000' AS DateTime2), CAST(N'2026-06-06T01:49:56.0000000' AS DateTime2))
INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'cccccccc-cccc-cccc-cccc-cccccccccccc', N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 45, N'The Final Battle', N'review', CAST(N'2026-06-05' AS Date), NULL, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[Chapters] ([ChapterId], [SeriesId], [ChapterNumber], [Title], [Status], [DueDate], [SubmittedForPublishingAt], [CreatedAt], [UpdatedAt]) VALUES (N'10383c7c-1dce-4564-828c-fca616b157c9', N'7f8071f6-997a-4d6b-981b-4968f321cfac', 1, N'Vụ án mạng trong phòng kín', N'draft', CAST(N'2026-07-20' AS Date), NULL, CAST(N'2026-06-06T04:15:49.0000000' AS DateTime2), CAST(N'2026-06-06T04:15:49.0000000' AS DateTime2))
INSERT [dbo].[SeriesProposals] ([ProposalId], [SeriesId], [SubmittedById], [ReviewedById], [Status], [ReviewNote], [SubmittedAt], [ReviewedAt]) VALUES (N'106264bb-27dc-436e-bc40-32925ff8c38d', N'b0b654fb-0307-42b2-b950-d454f863ad32', N'11111111-1111-1111-1111-111111111111', NULL, N'submitted', NULL, CAST(N'2026-06-15T15:15:24.0000000' AS DateTime2), NULL)
INSERT [dbo].[SeriesProposals] ([ProposalId], [SeriesId], [SubmittedById], [ReviewedById], [Status], [ReviewNote], [SubmittedAt], [ReviewedAt]) VALUES (N'4cbee752-96a8-4e20-a962-4876deaaf612', N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', N'approved', N'Ý tưởng phá án rất tốt, duyệt triển khai vẽ nháp!', CAST(N'2026-06-06T04:01:31.0000000' AS DateTime2), CAST(N'2026-06-06T04:08:11.0000000' AS DateTime2))
INSERT [dbo].[SeriesProposals] ([ProposalId], [SeriesId], [SubmittedById], [ReviewedById], [Status], [ReviewNote], [SubmittedAt], [ReviewedAt]) VALUES (N'fe817a8b-5b6e-48e9-b2a7-96d00c3e28ad', N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'11111111-1111-1111-1111-111111111111', N'33333333-3333-3333-3333-333333333333', N'approved', N'Truyện hay!', CAST(N'2026-06-06T01:49:56.0000000' AS DateTime2), CAST(N'2026-06-06T01:50:42.0000000' AS DateTime2))
INSERT [dbo].[SeriesProposals] ([ProposalId], [SeriesId], [SubmittedById], [ReviewedById], [Status], [ReviewNote], [SubmittedAt], [ReviewedAt]) VALUES (N'd8774026-55bb-4178-955d-c1b302dae57b', N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'11111111-1111-1111-1111-111111111111', N'44444444-4444-4444-4444-444444444444', N'approved', N'Approved for regular publication.', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'Action')
INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'Detective')
INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'7f8071f6-997a-4d6b-981b-4968f321cfac', N'Mystery')
INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'Action')
INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'Fantasy')
INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'b0b654fb-0307-42b2-b950-d454f863ad32', N'Fantasy')
INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'Action')
INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'Drama')
INSERT [dbo].[SeriesGenres] ([SeriesId], [Genre]) VALUES (N'e55ee349-f381-4f7f-b60b-e23a5c842cd0', N'Fantasy')
INSERT [dbo].[ReaderVotes] ([ReaderVoteId], [SeriesId], [WeekNumber], [YearNumber], [Votes], [RankNumber], [CreatedAt]) VALUES (N'f2498bbb-a6f3-4b43-8738-1ed53d91f543', N'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 20, 2026, 2250, 3, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[PublishSchedules] ([PublishScheduleId], [ChapterId], [ScheduledDate], [Status], [ApprovedById], [PublishedAt], [CreatedAt]) VALUES (N'f455eb78-77b4-4096-9421-29e8bd3dbc89', N'cccccccc-cccc-cccc-cccc-cccccccccccc', CAST(N'2026-06-10T09:00:00.0000000' AS DateTime2), N'scheduled', N'44444444-4444-4444-4444-444444444444', NULL, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'20fcc7ca-44ba-4cf6-a51a-0345ea4aa7e4', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 23, N'/Uploads/969a5d50-6aa3-497c-a486-64c8fd68d6b2.webp', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-12T01:51:41.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'faa54688-13b7-43d1-959f-113901cb3156', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 12, N'/Uploads/d4a5cc8f-181e-44c1-988e-d25bc32017dd.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'acc80f8f-630a-4c46-9047-1d9ead6e89e4', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, N'/Uploads/de4cfdf7-a77e-4b62-891b-f9575441fc8a.png', N'pending', NULL, CAST(N'2026-06-02T00:02:11.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'57f8a2d8-adaf-4afd-bd58-3c79b9438ab5', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 3, N'/Uploads/a3b3e64a-51c6-4fb3-bbcd-1efda9c4145d.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 1, N'/Uploads/cee677f8-dda8-45dd-ac5f-d7fbe8541f68.png', N'approved', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'dabe8e8a-0088-4e61-850c-44efc1309228', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 22, N'/Uploads/22c58a85-efa4-44c1-bab6-3c63484e33bd.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-07T14:14:17.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'415bfc43-f200-40ae-90de-4c1b0f8f191c', N'1958d9bc-2038-4554-9080-5c828a373f59', 4, N'/Uploads/496dc4b2-6431-4464-afeb-8eb3613aea47.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'4f74b3b3-47e3-4805-aede-4d318b03fcbc', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 3, N'/Uploads/71a56901-996b-4195-a92b-f4c64459dfb7.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'5fc8aa2c-1ebf-4d93-87e8-54ef7a8fe1e2', N'1958d9bc-2038-4554-9080-5c828a373f59', 2, N'/Uploads/1c7571cc-6a53-455d-9d22-1a3b48f231aa.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'5da13b7b-180b-4727-ba3a-566ca14a87cc', N'1958d9bc-2038-4554-9080-5c828a373f59', 3, N'/Uploads/ea60689a-83cf-4949-af69-e5c28d5bf11c.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'56cfa8bd-a6db-4b11-961f-5c3915e426c2', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 9, N'/Uploads/c04e953a-09ee-47ef-97c0-cf1f5c3dca85.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:05:20.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'd2eea4ed-d0d9-4532-811e-64bdbfbc37d8', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 19, N'/Uploads/8e43fc56-66a6-453a-a435-d96c1ad693d3.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'9eb8b692-d401-4a65-a908-6cc2e37dd92d', N'6f2d3f6d-0afd-4ebc-9840-4935a6aca47c', 2, N'/Uploads/9f649c9b-0da5-4c47-bdc9-483b21c65ed5.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'255a21b0-6344-4547-a1b0-79a6a93dda7e', N'1958d9bc-2038-4554-9080-5c828a373f59', 1, N'/Uploads/cf291b8f-06d2-4f0b-ad9b-13157d4ad860.png', N'approved', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'0a7137d7-bee6-480c-9e9d-79cbc1ef95a1', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 13, N'/Uploads/31a37062-2e46-4a3a-9f41-ff9239582adc.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'35da7d5f-6059-483b-bfaa-834985546a19', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 5, N'/Uploads/9f7773eb-73d7-4631-8f52-4b66343b9a0c.png', N'pending', NULL, CAST(N'2026-06-02T23:51:00.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'622559de-1402-42c4-b896-8674976b4b7e', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 4, N'/Uploads/3cbdca8a-88aa-4451-9262-037c1ea9acd6.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'4922a65f-0ca0-491c-911d-8be19977be4d', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 18, N'/Uploads/0c5c2afb-d1c1-4f5c-8ee9-d8234264f956.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'06bd0581-c0ec-496d-a1fb-8cc7d5c65393', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 7, N'/Uploads/b597962b-74ec-4561-817f-915698d98e78.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T00:55:29.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'1e8ca607-21ad-4371-8dce-8f17d7f3315c', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 16, N'/Uploads/d6fc2461-1f91-404a-a120-f1998eb6f2b3.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'83823f6a-1200-4952-8063-8f375def87e6', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, N'/Uploads/cc7db026-4bfd-4542-b2e9-f1ff8672be3f.png', N'pending', NULL, CAST(N'2026-06-02T00:26:17.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'389f4d17-111c-459a-a64a-95dff7f88e1b', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 8, N'/Uploads/2753f180-839a-405a-ab9d-1274461ac340.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:02:08.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'b56e6559-c1b4-4c12-a9e4-a8d5d48ba28c', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 21, N'/Uploads/4c03fce3-edda-4984-a395-907a87c5d05a.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'e38f1826-a5fa-494e-aa75-b20e4bc406d5', N'6f2d3f6d-0afd-4ebc-9840-4935a6aca47c', 1, N'/Uploads/77e97e89-2540-49f6-ad73-b8784c1b1190.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'b1fd0a70-01b7-4872-9282-b4ec3de7abd2', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 2, N'/Uploads/ec4c707e-09cf-4cc8-8e99-758716c0895b.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'107acb27-4b31-42e9-9fb9-b546bf26535c', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 17, N'/Uploads/c50edda5-6a48-48b9-9194-d8e75b82a89c.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'fc0ffe41-3ad8-4586-8abb-b945ddf7b075', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 11, N'/Uploads/0d4e4bc4-e590-419f-908a-5b23a162ae73.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:23:01.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'9e29ab9c-3164-4739-9a05-b98a561ce1f4', N'1958d9bc-2038-4554-9080-5c828a373f59', 5, N'/Uploads/5e193cae-b835-4adf-8036-23274929f11c.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'987076c2-86e0-49bc-8182-c6e341c19b65', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 1, N'/Uploads/de04432c-bfb1-4c54-854b-16d8ba5e4972.png', N'approved', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:33.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'fd4d69e8-8933-4ae6-90a0-d67f5b856dc6', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 5, N'/Uploads/f9c9ca26-be1e-4e00-b26a-210c8d64e6f5.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'e753b24a-fb81-4825-a39d-d86e4ec8b13f', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 20, N'/Uploads/96c32997-e8da-4f54-bc15-8bfe0ce20813.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:31:24.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'64053eaf-8917-441b-b4f6-dadb764ed697', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 6, N'/Uploads/aa14110d-e847-4eb0-beb6-590a4b0b148d.png', N'pending', NULL, CAST(N'2026-06-06T00:44:21.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'd04f8db0-3b17-4119-8d76-df552be85144', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 2, N'/Uploads/53fb67f0-55fe-40ab-a198-b4213885bedb.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'fc74cad8-cc33-4caa-8129-e139d7c10035', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 14, N'/Uploads/5ab451d6-9623-462f-bdd9-9b17c34b7a35.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, N'/uploads/dragon-hunters/ch45/page_001.png', N'submitted', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'39460828-0726-4d30-b63d-f3ee8d4ce438', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 15, N'/Uploads/5ff69144-dc85-4611-b781-e679ba779f8d.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:30:48.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'b0afa419-9cf7-4919-9583-f657e32527c8', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 10, N'/Uploads/5f8330c3-b3fc-40d8-b942-1a3294e3755d.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:11:19.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'3346e595-6440-442f-91b9-f7365409f809', N'a5e42258-9f06-462a-9794-60f5a22aaee6', 4, N'/Uploads/0bc53bd6-6eda-41f6-a121-dcba42241ad1.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'527b82a2-77ec-48f9-a995-fc39fb1cd2e9', N'87a62f2e-ddd1-4c29-a9db-093a88370eb4', 5, N'/Uploads/d936cde2-f984-4ffe-b852-14e5767aa119.png', N'pending', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2))
INSERT [dbo].[MangaPages] ([PageId], [ChapterId], [PageNumber], [CurrentImageUrl], [Status], [UploadedById], [UploadedAt]) VALUES (N'ffffffff-ffff-ffff-ffff-ffffffffffff', N'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, N'/uploads/dragon-hunters/ch45/page_002.png', N'assigned', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'20c7880e-bd5d-471a-8da7-00fb5bab11fd', N'4f74b3b3-47e3-4805-aede-4d318b03fcbc', 1, N'/Uploads/71a56901-996b-4195-a92b-f4c64459dfb7.png', N'page3.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'46c86084-d692-431b-bfe8-1b61d12d2b5d', N'd04f8db0-3b17-4119-8d76-df552be85144', 1, N'/Uploads/53fb67f0-55fe-40ab-a198-b4213885bedb.png', N'page2.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'025a7c8f-dbb9-4d40-b88b-24f1434b7290', N'5fc8aa2c-1ebf-4d93-87e8-54ef7a8fe1e2', 1, N'/Uploads/1c7571cc-6a53-455d-9d22-1a3b48f231aa.png', N'page2.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'5c3c688b-f95a-4e47-9e2b-2b6b39b0402b', N'255a21b0-6344-4547-a1b0-79a6a93dda7e', 1, N'/Uploads/cf291b8f-06d2-4f0b-ad9b-13157d4ad860.png', N'page1.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'd38c0382-e967-4ac3-ad00-2f3d47bbf35f', N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, N'/uploads/dragon-hunters/ch45/page_001_v1.png', N'page_001.png', 2516582, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), N'Initial upload')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'a00c367c-8dac-44fa-a797-39fa0f2d323e', N'fd4d69e8-8933-4ae6-90a0-d67f5b856dc6', 1, N'/Uploads/f9c9ca26-be1e-4e00-b26a-210c8d64e6f5.png', N'page5.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'14d62099-75da-414d-b3ef-68d167807f86', N'5da13b7b-180b-4727-ba3a-566ca14a87cc', 1, N'/Uploads/ea60689a-83cf-4949-af69-e5c28d5bf11c.png', N'page3.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'e6e3fed7-b0ea-410d-b59d-7ac43cd69d9c', N'9e29ab9c-3164-4739-9a05-b98a561ce1f4', 1, N'/Uploads/5e193cae-b835-4adf-8036-23274929f11c.png', N'page5.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'038be384-cfb4-43c6-a822-9f8c108eeec8', N'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, N'/uploads/dragon-hunters/ch45/page_002_v1.png', N'page_002.png', 2202009, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), N'Initial upload')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'a5e98524-9648-481f-bc54-d8fe0e9cdeaf', N'987076c2-86e0-49bc-8182-c6e341c19b65', 1, N'/Uploads/de04432c-bfb1-4c54-854b-16d8ba5e4972.png', N'page1.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:33.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'7cf7597c-799b-4f03-9b0f-f303bfbc11e7', N'415bfc43-f200-40ae-90de-4c1b0f8f191c', 1, N'/Uploads/496dc4b2-6431-4464-afeb-8eb3613aea47.png', N'page4.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:09:05.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageVersions] ([PageVersionId], [PageId], [VersionNumber], [FileUrl], [FileName], [FileSizeBytes], [MimeType], [UploadedById], [CreatedAt], [Note]) VALUES (N'bdc5db08-d3a6-4469-b6ea-f55d3ce305c4', N'3346e595-6440-442f-91b9-f7365409f809', 1, N'/Uploads/0bc53bd6-6eda-41f6-a121-dcba42241ad1.png', N'page4.png', 16, N'image/png', N'11111111-1111-1111-1111-111111111111', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), N'Tải lên trang ban đầu')
INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'8bd9fa0c-9ed0-4151-9b36-4626419def23', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'33333333-3333-3333-3333-333333333333', N'approved', N'Trang vẽ đẹp, được duyệt!', CAST(N'2026-06-06T01:52:16.0000000' AS DateTime2))
INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'b4df7ccd-2183-4beb-ab1b-7966d897891a', N'255a21b0-6344-4547-a1b0-79a6a93dda7e', N'33333333-3333-3333-3333-333333333333', N'approved', NULL, CAST(N'2026-06-06T03:09:08.0000000' AS DateTime2))
INSERT [dbo].[PageReviews] ([ReviewId], [PageId], [ReviewerId], [Decision], [Comment], [CreatedAt]) VALUES (N'6b2922f2-ef7c-49ff-8eca-7f5c643efc3b', N'987076c2-86e0-49bc-8182-c6e341c19b65', N'33333333-3333-3333-3333-333333333333', N'approved', NULL, CAST(N'2026-06-06T03:17:37.0000000' AS DateTime2))
INSERT [dbo].[PageRegions] ([RegionId], [PageId], [Type], [X], [Y], [Width], [Height], [AssignedToId], [Status], [CreatedAt]) VALUES (N'12121212-1212-1212-1212-121212121212', N'ffffffff-ffff-ffff-ffff-ffffffffffff', N'background', CAST(0.00 AS Decimal(9, 2)), CAST(0.00 AS Decimal(9, 2)), CAST(800.00 AS Decimal(9, 2)), CAST(1200.00 AS Decimal(9, 2)), N'22222222-2222-2222-2222-222222222222', N'in_progress', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'8a2c0dde-7e94-4aa8-bcf2-17ef682f5f2d', N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', N'33333333-3333-3333-3333-333333333333', CAST(180.00 AS Decimal(9, 2)), CAST(260.00 AS Decimal(9, 2)), CAST(120.00 AS Decimal(9, 2)), CAST(80.00 AS Decimal(9, 2)), N'Adjust panel transition before approval.', N'open', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), NULL)
INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'4b76f285-edaf-4876-8fe4-597d1231fc0d', N'987076c2-86e0-49bc-8182-c6e341c19b65', N'11111111-1111-1111-1111-111111111111', CAST(50.50 AS Decimal(9, 2)), CAST(100.25 AS Decimal(9, 2)), CAST(200.00 AS Decimal(9, 2)), CAST(150.00 AS Decimal(9, 2)), N'Cần vẽ lại nét mực', N'open', CAST(N'2026-06-06T03:17:34.0000000' AS DateTime2), NULL)
INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'f8abce85-05e3-4a00-be1e-68e03b1d3d2f', N'e38f1826-a5fa-494e-aa75-b20e4bc406d5', N'11111111-1111-1111-1111-111111111111', CAST(100.00 AS Decimal(9, 2)), CAST(200.00 AS Decimal(9, 2)), CAST(50.00 AS Decimal(9, 2)), CAST(30.00 AS Decimal(9, 2)), N'Tô màu đậm hơn ở đây', N'open', CAST(N'2026-06-06T01:50:41.0000000' AS DateTime2), NULL)
INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'7d02e924-379a-4132-bd51-c57a3047c468', N'255a21b0-6344-4547-a1b0-79a6a93dda7e', N'11111111-1111-1111-1111-111111111111', CAST(50.50 AS Decimal(9, 2)), CAST(100.25 AS Decimal(9, 2)), CAST(200.00 AS Decimal(9, 2)), CAST(150.00 AS Decimal(9, 2)), N'Cần vẽ lại nét mực', N'open', CAST(N'2026-06-06T03:09:06.0000000' AS DateTime2), NULL)
INSERT [dbo].[PageAnnotations] ([AnnotationId], [PageId], [CreatedById], [X], [Y], [Width], [Height], [Body], [Status], [CreatedAt], [ResolvedAt]) VALUES (N'c7166a25-8923-4a16-89ce-e82286a7fa0c', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', N'11111111-1111-1111-1111-111111111111', CAST(50.50 AS Decimal(9, 2)), CAST(100.25 AS Decimal(9, 2)), CAST(200.00 AS Decimal(9, 2)), CAST(150.00 AS Decimal(9, 2)), N'Cần vẽ lại nét mực', N'open', CAST(N'2026-06-06T01:52:15.0000000' AS DateTime2), NULL)
INSERT [dbo].[ReviewComments] ([CommentId], [PageId], [UserId], [Body], [CreatedAt]) VALUES (N'c33d0796-1ca5-48d0-a0ff-cc137b031267', N'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', N'33333333-3333-3333-3333-333333333333', N'The panel transitions look good. One small fix remains.', CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'13131313-1313-1313-1313-131313131313', N'Background cleanup page 2', N'Clean and finish background region.', N'background', N'ffffffff-ffff-ffff-ffff-ffffffffffff', N'12121212-1212-1212-1212-121212121212', N'22222222-2222-2222-2222-222222222222', N'11111111-1111-1111-1111-111111111111', N'in_progress', CAST(N'2026-05-30' AS Date), CAST(180.00 AS Decimal(12, 2)), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2), CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'7d47f692-e741-49bb-9117-78c6d8687ff0', N'Tô màu trang 1', N'Tô màu theo bảng màu đã được duyệt, đảm bảo chi tiết', N'coloring', N'987076c2-86e0-49bc-8182-c6e341c19b65', NULL, NULL, N'11111111-1111-1111-1111-111111111111', N'pending', CAST(N'2026-07-30' AS Date), CAST(150000.00 AS Decimal(12, 2)), CAST(N'2026-06-06T03:17:35.0000000' AS DateTime2), CAST(N'2026-06-06T03:17:35.0000000' AS DateTime2))
INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'7218c022-103c-4436-aef9-7e18fe109af0', N'Tô màu trang 1', N'Tô màu theo bảng màu đã được duyệt, đảm bảo chi tiết', N'coloring', N'd7afd1f1-dc7d-4f88-9908-3ccfe14ff539', NULL, N'22222222-2222-2222-2222-222222222222', N'11111111-1111-1111-1111-111111111111', N'pending', CAST(N'2026-07-30' AS Date), CAST(150000.00 AS Decimal(12, 2)), CAST(N'2026-06-06T01:52:16.0000000' AS DateTime2), CAST(N'2026-06-06T01:52:16.0000000' AS DateTime2))
INSERT [dbo].[Tasks] ([TaskId], [Title], [Description], [Type], [PageId], [RegionId], [AssigneeId], [AssignerId], [Status], [DueDate], [PaymentAmount], [CreatedAt], [UpdatedAt]) VALUES (N'd0d99ce6-0205-4d75-b476-e1e8d9d2bc37', N'Tô màu trang 1', N'Tô màu theo bảng màu đã được duyệt, đảm bảo chi tiết', N'coloring', N'255a21b0-6344-4547-a1b0-79a6a93dda7e', NULL, NULL, N'11111111-1111-1111-1111-111111111111', N'pending', CAST(N'2026-07-30' AS Date), CAST(150000.00 AS Decimal(12, 2)), CAST(N'2026-06-06T03:09:06.0000000' AS DateTime2), CAST(N'2026-06-06T03:09:06.0000000' AS DateTime2))
INSERT [dbo].[PayrollRecords] ([PayrollRecordId], [AssistantId], [TaskId], [PeriodStart], [PeriodEnd], [BaseAmount], [BonusAmount], [DeductionAmount], [Status], [PaidAt], [CreatedAt]) VALUES (N'b4416366-0190-46e3-adea-53ae108ef109', N'22222222-2222-2222-2222-222222222222', N'13131313-1313-1313-1313-131313131313', CAST(N'2026-05-16' AS Date), CAST(N'2026-05-31' AS Date), CAST(180.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), N'pending', NULL, CAST(N'2026-06-01T12:30:45.0000000' AS DateTime2))
SET ANSI_PADDING ON

ALTER TABLE [dbo].[Roles] ADD  CONSTRAINT [UQ_Roles_Code] UNIQUE NONCLUSTERED 
(
	[Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
SET ANSI_PADDING ON

ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [UQ_Users_Email] UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
CREATE NONCLUSTERED INDEX [IX_Users_RoleId] ON [dbo].[Users]
(
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
CREATE NONCLUSTERED INDEX [IX_Series_MangakaId] ON [dbo].[Series]
(
	[MangakaId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
SET ANSI_PADDING ON

CREATE NONCLUSTERED INDEX [IX_Series_Status_Ranking] ON [dbo].[Series]
(
	[Status] ASC,
	[Ranking] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
CREATE NONCLUSTERED INDEX [IX_Series_TantouId] ON [dbo].[Series]
(
	[TantouId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
CREATE NONCLUSTERED INDEX [IX_Notifications_UserId_IsRead] ON [dbo].[Notifications]
(
	[UserId] ASC,
	[IsRead] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
SET ANSI_PADDING ON

CREATE NONCLUSTERED INDEX [IX_AuditLogs_Entity] ON [dbo].[AuditLogs]
(
	[EntityType] ASC,
	[EntityId] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
ALTER TABLE [dbo].[Chapters] ADD  CONSTRAINT [UQ_Chapters_Series_Number] UNIQUE NONCLUSTERED 
(
	[SeriesId] ASC,
	[ChapterNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
SET ANSI_PADDING ON

CREATE NONCLUSTERED INDEX [IX_Chapters_SeriesId_Status] ON [dbo].[Chapters]
(
	[SeriesId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
ALTER TABLE [dbo].[ReaderVotes] ADD  CONSTRAINT [UQ_ReaderVotes_Series_Week] UNIQUE NONCLUSTERED 
(
	[SeriesId] ASC,
	[WeekNumber] ASC,
	[YearNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
CREATE NONCLUSTERED INDEX [IX_ReaderVotes_Week_Rank] ON [dbo].[ReaderVotes]
(
	[YearNumber] ASC,
	[WeekNumber] ASC,
	[RankNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
ALTER TABLE [dbo].[MangaPages] ADD  CONSTRAINT [UQ_MangaPages_Chapter_PageNumber] UNIQUE NONCLUSTERED 
(
	[ChapterId] ASC,
	[PageNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
SET ANSI_PADDING ON

CREATE NONCLUSTERED INDEX [IX_MangaPages_ChapterId_Status] ON [dbo].[MangaPages]
(
	[ChapterId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
ALTER TABLE [dbo].[PageVersions] ADD  CONSTRAINT [UQ_PageVersions_Page_Version] UNIQUE NONCLUSTERED 
(
	[PageId] ASC,
	[VersionNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
SET ANSI_PADDING ON

CREATE NONCLUSTERED INDEX [IX_PageRegions_PageId_Status] ON [dbo].[PageRegions]
(
	[PageId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
SET ANSI_PADDING ON

CREATE NONCLUSTERED INDEX [IX_Tasks_AssigneeId_Status] ON [dbo].[Tasks]
(
	[AssigneeId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
CREATE NONCLUSTERED INDEX [IX_Tasks_PageId] ON [dbo].[Tasks]
(
	[PageId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
SET ANSI_PADDING ON

CREATE NONCLUSTERED INDEX [IX_PayrollRecords_AssistantId_Status] ON [dbo].[PayrollRecords]
(
	[AssistantId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
ALTER TABLE [dbo].[Users] ADD  DEFAULT (newid()) FOR [UserId]
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_IsActive]  DEFAULT ((1)) FOR [IsActive]
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
ALTER TABLE [dbo].[Series] ADD  DEFAULT (newid()) FOR [SeriesId]
ALTER TABLE [dbo].[Series] ADD  CONSTRAINT [DF_Series_Status]  DEFAULT ('proposal') FOR [Status]
ALTER TABLE [dbo].[Series] ADD  CONSTRAINT [DF_Series_ReaderCount]  DEFAULT ((0)) FOR [ReaderCount]
ALTER TABLE [dbo].[Series] ADD  CONSTRAINT [DF_Series_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[Series] ADD  CONSTRAINT [DF_Series_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
ALTER TABLE [dbo].[Notifications] ADD  DEFAULT (newid()) FOR [NotificationId]
ALTER TABLE [dbo].[Notifications] ADD  CONSTRAINT [DF_Notifications_IsRead]  DEFAULT ((0)) FOR [IsRead]
ALTER TABLE [dbo].[Notifications] ADD  CONSTRAINT [DF_Notifications_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[AuditLogs] ADD  DEFAULT (newid()) FOR [AuditLogId]
ALTER TABLE [dbo].[AuditLogs] ADD  CONSTRAINT [DF_AuditLogs_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[AssistantProfiles] ADD  CONSTRAINT [DF_AssistantProfiles_HourlyRate]  DEFAULT ((0)) FOR [HourlyRate]
ALTER TABLE [dbo].[Chapters] ADD  DEFAULT (newid()) FOR [ChapterId]
ALTER TABLE [dbo].[Chapters] ADD  CONSTRAINT [DF_Chapters_Status]  DEFAULT ('draft') FOR [Status]
ALTER TABLE [dbo].[Chapters] ADD  CONSTRAINT [DF_Chapters_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[Chapters] ADD  CONSTRAINT [DF_Chapters_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
ALTER TABLE [dbo].[SeriesProposals] ADD  DEFAULT (newid()) FOR [ProposalId]
ALTER TABLE [dbo].[SeriesProposals] ADD  CONSTRAINT [DF_SeriesProposals_Status]  DEFAULT ('submitted') FOR [Status]
ALTER TABLE [dbo].[SeriesProposals] ADD  CONSTRAINT [DF_SeriesProposals_SubmittedAt]  DEFAULT (sysutcdatetime()) FOR [SubmittedAt]
ALTER TABLE [dbo].[ReaderVotes] ADD  DEFAULT (newid()) FOR [ReaderVoteId]
ALTER TABLE [dbo].[ReaderVotes] ADD  CONSTRAINT [DF_ReaderVotes_Votes]  DEFAULT ((0)) FOR [Votes]
ALTER TABLE [dbo].[ReaderVotes] ADD  CONSTRAINT [DF_ReaderVotes_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[PublishSchedules] ADD  DEFAULT (newid()) FOR [PublishScheduleId]
ALTER TABLE [dbo].[PublishSchedules] ADD  CONSTRAINT [DF_PublishSchedules_Status]  DEFAULT ('scheduled') FOR [Status]
ALTER TABLE [dbo].[PublishSchedules] ADD  CONSTRAINT [DF_PublishSchedules_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[MangaPages] ADD  DEFAULT (newid()) FOR [PageId]
ALTER TABLE [dbo].[MangaPages] ADD  CONSTRAINT [DF_MangaPages_Status]  DEFAULT ('pending') FOR [Status]
ALTER TABLE [dbo].[PageVersions] ADD  DEFAULT (newid()) FOR [PageVersionId]
ALTER TABLE [dbo].[PageVersions] ADD  CONSTRAINT [DF_PageVersions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[PageReviews] ADD  DEFAULT (newid()) FOR [ReviewId]
ALTER TABLE [dbo].[PageReviews] ADD  CONSTRAINT [DF_PageReviews_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[PageRegions] ADD  DEFAULT (newid()) FOR [RegionId]
ALTER TABLE [dbo].[PageRegions] ADD  CONSTRAINT [DF_PageRegions_Status]  DEFAULT ('pending') FOR [Status]
ALTER TABLE [dbo].[PageRegions] ADD  CONSTRAINT [DF_PageRegions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[PageAnnotations] ADD  DEFAULT (newid()) FOR [AnnotationId]
ALTER TABLE [dbo].[PageAnnotations] ADD  CONSTRAINT [DF_PageAnnotations_Status]  DEFAULT ('open') FOR [Status]
ALTER TABLE [dbo].[PageAnnotations] ADD  CONSTRAINT [DF_PageAnnotations_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[ReviewComments] ADD  DEFAULT (newid()) FOR [CommentId]
ALTER TABLE [dbo].[ReviewComments] ADD  CONSTRAINT [DF_ReviewComments_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[Tasks] ADD  DEFAULT (newid()) FOR [TaskId]
ALTER TABLE [dbo].[Tasks] ADD  CONSTRAINT [DF_Tasks_Status]  DEFAULT ('pending') FOR [Status]
ALTER TABLE [dbo].[Tasks] ADD  CONSTRAINT [DF_Tasks_PaymentAmount]  DEFAULT ((0)) FOR [PaymentAmount]
ALTER TABLE [dbo].[Tasks] ADD  CONSTRAINT [DF_Tasks_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[Tasks] ADD  CONSTRAINT [DF_Tasks_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
ALTER TABLE [dbo].[PayrollRecords] ADD  DEFAULT (newid()) FOR [PayrollRecordId]
ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_BaseAmount]  DEFAULT ((0)) FOR [BaseAmount]
ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_BonusAmount]  DEFAULT ((0)) FOR [BonusAmount]
ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_DeductionAmount]  DEFAULT ((0)) FOR [DeductionAmount]
ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_Status]  DEFAULT ('pending') FOR [Status]
ALTER TABLE [dbo].[PayrollRecords] ADD  CONSTRAINT [DF_PayrollRecords_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
ALTER TABLE [dbo].[TaskSubmissions] ADD  DEFAULT (newid()) FOR [SubmissionId]
ALTER TABLE [dbo].[TaskSubmissions] ADD  CONSTRAINT [DF_TaskSubmissions_Status]  DEFAULT ('submitted') FOR [Status]
ALTER TABLE [dbo].[TaskSubmissions] ADD  CONSTRAINT [DF_TaskSubmissions_SubmittedAt]  DEFAULT (sysutcdatetime()) FOR [SubmittedAt]
ALTER TABLE [dbo].[Users]  WITH CHECK ADD  CONSTRAINT [FK_Users_Roles] FOREIGN KEY([RoleId])
REFERENCES [dbo].[Roles] ([RoleId])
ALTER TABLE [dbo].[Users] CHECK CONSTRAINT [FK_Users_Roles]
ALTER TABLE [dbo].[Series]  WITH CHECK ADD  CONSTRAINT [FK_Series_Mangaka] FOREIGN KEY([MangakaId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[Series] CHECK CONSTRAINT [FK_Series_Mangaka]
ALTER TABLE [dbo].[Series]  WITH CHECK ADD  CONSTRAINT [FK_Series_Tantou] FOREIGN KEY([TantouId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[Series] CHECK CONSTRAINT [FK_Series_Tantou]
ALTER TABLE [dbo].[Notifications]  WITH CHECK ADD  CONSTRAINT [FK_Notifications_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[Notifications] CHECK CONSTRAINT [FK_Notifications_User]
ALTER TABLE [dbo].[AuditLogs]  WITH CHECK ADD  CONSTRAINT [FK_AuditLogs_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[AuditLogs] CHECK CONSTRAINT [FK_AuditLogs_User]
ALTER TABLE [dbo].[AssistantProfiles]  WITH CHECK ADD  CONSTRAINT [FK_AssistantProfiles_Users] FOREIGN KEY([AssistantId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[AssistantProfiles] CHECK CONSTRAINT [FK_AssistantProfiles_Users]
ALTER TABLE [dbo].[Chapters]  WITH CHECK ADD  CONSTRAINT [FK_Chapters_Series] FOREIGN KEY([SeriesId])
REFERENCES [dbo].[Series] ([SeriesId])
ALTER TABLE [dbo].[Chapters] CHECK CONSTRAINT [FK_Chapters_Series]
ALTER TABLE [dbo].[SeriesProposals]  WITH CHECK ADD  CONSTRAINT [FK_SeriesProposals_ReviewedBy] FOREIGN KEY([ReviewedById])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[SeriesProposals] CHECK CONSTRAINT [FK_SeriesProposals_ReviewedBy]
ALTER TABLE [dbo].[SeriesProposals]  WITH CHECK ADD  CONSTRAINT [FK_SeriesProposals_Series] FOREIGN KEY([SeriesId])
REFERENCES [dbo].[Series] ([SeriesId])
ALTER TABLE [dbo].[SeriesProposals] CHECK CONSTRAINT [FK_SeriesProposals_Series]
ALTER TABLE [dbo].[SeriesProposals]  WITH CHECK ADD  CONSTRAINT [FK_SeriesProposals_SubmittedBy] FOREIGN KEY([SubmittedById])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[SeriesProposals] CHECK CONSTRAINT [FK_SeriesProposals_SubmittedBy]
ALTER TABLE [dbo].[SeriesGenres]  WITH CHECK ADD  CONSTRAINT [FK_SeriesGenres_Series] FOREIGN KEY([SeriesId])
REFERENCES [dbo].[Series] ([SeriesId])
ALTER TABLE [dbo].[SeriesGenres] CHECK CONSTRAINT [FK_SeriesGenres_Series]
ALTER TABLE [dbo].[ReaderVotes]  WITH CHECK ADD  CONSTRAINT [FK_ReaderVotes_Series] FOREIGN KEY([SeriesId])
REFERENCES [dbo].[Series] ([SeriesId])
ALTER TABLE [dbo].[ReaderVotes] CHECK CONSTRAINT [FK_ReaderVotes_Series]
ALTER TABLE [dbo].[PublishSchedules]  WITH CHECK ADD  CONSTRAINT [FK_PublishSchedules_ApprovedBy] FOREIGN KEY([ApprovedById])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[PublishSchedules] CHECK CONSTRAINT [FK_PublishSchedules_ApprovedBy]
ALTER TABLE [dbo].[PublishSchedules]  WITH CHECK ADD  CONSTRAINT [FK_PublishSchedules_Chapter] FOREIGN KEY([ChapterId])
REFERENCES [dbo].[Chapters] ([ChapterId])
ALTER TABLE [dbo].[PublishSchedules] CHECK CONSTRAINT [FK_PublishSchedules_Chapter]
ALTER TABLE [dbo].[MangaPages]  WITH CHECK ADD  CONSTRAINT [FK_MangaPages_Chapters] FOREIGN KEY([ChapterId])
REFERENCES [dbo].[Chapters] ([ChapterId])
ALTER TABLE [dbo].[MangaPages] CHECK CONSTRAINT [FK_MangaPages_Chapters]
ALTER TABLE [dbo].[MangaPages]  WITH CHECK ADD  CONSTRAINT [FK_MangaPages_UploadedBy] FOREIGN KEY([UploadedById])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[MangaPages] CHECK CONSTRAINT [FK_MangaPages_UploadedBy]
ALTER TABLE [dbo].[PageVersions]  WITH CHECK ADD  CONSTRAINT [FK_PageVersions_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
ALTER TABLE [dbo].[PageVersions] CHECK CONSTRAINT [FK_PageVersions_Page]
ALTER TABLE [dbo].[PageVersions]  WITH CHECK ADD  CONSTRAINT [FK_PageVersions_UploadedBy] FOREIGN KEY([UploadedById])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[PageVersions] CHECK CONSTRAINT [FK_PageVersions_UploadedBy]
ALTER TABLE [dbo].[PageReviews]  WITH CHECK ADD  CONSTRAINT [FK_PageReviews_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
ALTER TABLE [dbo].[PageReviews] CHECK CONSTRAINT [FK_PageReviews_Page]
ALTER TABLE [dbo].[PageReviews]  WITH CHECK ADD  CONSTRAINT [FK_PageReviews_Reviewer] FOREIGN KEY([ReviewerId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[PageReviews] CHECK CONSTRAINT [FK_PageReviews_Reviewer]
ALTER TABLE [dbo].[PageRegions]  WITH CHECK ADD  CONSTRAINT [FK_PageRegions_AssignedTo] FOREIGN KEY([AssignedToId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[PageRegions] CHECK CONSTRAINT [FK_PageRegions_AssignedTo]
ALTER TABLE [dbo].[PageRegions]  WITH CHECK ADD  CONSTRAINT [FK_PageRegions_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
ALTER TABLE [dbo].[PageRegions] CHECK CONSTRAINT [FK_PageRegions_Page]
ALTER TABLE [dbo].[PageAnnotations]  WITH CHECK ADD  CONSTRAINT [FK_PageAnnotations_CreatedBy] FOREIGN KEY([CreatedById])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[PageAnnotations] CHECK CONSTRAINT [FK_PageAnnotations_CreatedBy]
ALTER TABLE [dbo].[PageAnnotations]  WITH CHECK ADD  CONSTRAINT [FK_PageAnnotations_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
ALTER TABLE [dbo].[PageAnnotations] CHECK CONSTRAINT [FK_PageAnnotations_Page]
ALTER TABLE [dbo].[ReviewComments]  WITH CHECK ADD  CONSTRAINT [FK_ReviewComments_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
ALTER TABLE [dbo].[ReviewComments] CHECK CONSTRAINT [FK_ReviewComments_Page]
ALTER TABLE [dbo].[ReviewComments]  WITH CHECK ADD  CONSTRAINT [FK_ReviewComments_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[ReviewComments] CHECK CONSTRAINT [FK_ReviewComments_User]
ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [FK_Tasks_Assignee] FOREIGN KEY([AssigneeId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [FK_Tasks_Assignee]
ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [FK_Tasks_Assigner] FOREIGN KEY([AssignerId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [FK_Tasks_Assigner]
ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [FK_Tasks_Page] FOREIGN KEY([PageId])
REFERENCES [dbo].[MangaPages] ([PageId])
ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [FK_Tasks_Page]
ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [FK_Tasks_Region] FOREIGN KEY([RegionId])
REFERENCES [dbo].[PageRegions] ([RegionId])
ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [FK_Tasks_Region]
ALTER TABLE [dbo].[PayrollRecords]  WITH CHECK ADD  CONSTRAINT [FK_PayrollRecords_Assistant] FOREIGN KEY([AssistantId])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[PayrollRecords] CHECK CONSTRAINT [FK_PayrollRecords_Assistant]
ALTER TABLE [dbo].[PayrollRecords]  WITH CHECK ADD  CONSTRAINT [FK_PayrollRecords_Task] FOREIGN KEY([TaskId])
REFERENCES [dbo].[Tasks] ([TaskId])
ALTER TABLE [dbo].[PayrollRecords] CHECK CONSTRAINT [FK_PayrollRecords_Task]
ALTER TABLE [dbo].[TaskSubmissions]  WITH CHECK ADD  CONSTRAINT [FK_TaskSubmissions_PageVersion] FOREIGN KEY([PageVersionId])
REFERENCES [dbo].[PageVersions] ([PageVersionId])
ALTER TABLE [dbo].[TaskSubmissions] CHECK CONSTRAINT [FK_TaskSubmissions_PageVersion]
ALTER TABLE [dbo].[TaskSubmissions]  WITH CHECK ADD  CONSTRAINT [FK_TaskSubmissions_SubmittedBy] FOREIGN KEY([SubmittedById])
REFERENCES [dbo].[Users] ([UserId])
ALTER TABLE [dbo].[TaskSubmissions] CHECK CONSTRAINT [FK_TaskSubmissions_SubmittedBy]
ALTER TABLE [dbo].[TaskSubmissions]  WITH CHECK ADD  CONSTRAINT [FK_TaskSubmissions_Task] FOREIGN KEY([TaskId])
REFERENCES [dbo].[Tasks] ([TaskId])
ALTER TABLE [dbo].[TaskSubmissions] CHECK CONSTRAINT [FK_TaskSubmissions_Task]
ALTER TABLE [dbo].[Series]  WITH CHECK ADD  CONSTRAINT [CK_Series_Status] CHECK  (([Status]='cancelled' OR [Status]='completed' OR [Status]='hiatus' OR [Status]='active' OR [Status]='proposal'))
ALTER TABLE [dbo].[Series] CHECK CONSTRAINT [CK_Series_Status]
ALTER TABLE [dbo].[Notifications]  WITH CHECK ADD  CONSTRAINT [CK_Notifications_Type] CHECK  (([Type]='system' OR [Type]='deadline' OR [Type]='payment' OR [Type]='review_needed' OR [Type]='task_submitted' OR [Type]='task_assigned'))
ALTER TABLE [dbo].[Notifications] CHECK CONSTRAINT [CK_Notifications_Type]
ALTER TABLE [dbo].[AuditLogs]  WITH CHECK ADD  CONSTRAINT [CK_AuditLogs_DetailsJson] CHECK  (([DetailsJson] IS NULL OR isjson([DetailsJson])=(1)))
ALTER TABLE [dbo].[AuditLogs] CHECK CONSTRAINT [CK_AuditLogs_DetailsJson]
ALTER TABLE [dbo].[Chapters]  WITH CHECK ADD  CONSTRAINT [CK_Chapters_Status] CHECK  (([Status]='cancelled' OR [Status]='published' OR [Status]='approved' OR [Status]='review' OR [Status]='in_progress' OR [Status]='draft'))
ALTER TABLE [dbo].[Chapters] CHECK CONSTRAINT [CK_Chapters_Status]
ALTER TABLE [dbo].[SeriesProposals]  WITH CHECK ADD  CONSTRAINT [CK_SeriesProposals_Status] CHECK  (([Status]='rejected' OR [Status]='approved' OR [Status]='submitted' OR [Status]='draft'))
ALTER TABLE [dbo].[SeriesProposals] CHECK CONSTRAINT [CK_SeriesProposals_Status]
ALTER TABLE [dbo].[ReaderVotes]  WITH CHECK ADD  CONSTRAINT [CK_ReaderVotes_Week] CHECK  (([WeekNumber]>=(1) AND [WeekNumber]<=(53)))
ALTER TABLE [dbo].[ReaderVotes] CHECK CONSTRAINT [CK_ReaderVotes_Week]
ALTER TABLE [dbo].[PublishSchedules]  WITH CHECK ADD  CONSTRAINT [CK_PublishSchedules_Status] CHECK  (([Status]='cancelled' OR [Status]='published' OR [Status]='scheduled'))
ALTER TABLE [dbo].[PublishSchedules] CHECK CONSTRAINT [CK_PublishSchedules_Status]
ALTER TABLE [dbo].[MangaPages]  WITH CHECK ADD  CONSTRAINT [CK_MangaPages_Status] CHECK  (([Status]='revision' OR [Status]='approved' OR [Status]='review' OR [Status]='submitted' OR [Status]='in_progress' OR [Status]='assigned' OR [Status]='pending'))
ALTER TABLE [dbo].[MangaPages] CHECK CONSTRAINT [CK_MangaPages_Status]
ALTER TABLE [dbo].[PageReviews]  WITH CHECK ADD  CONSTRAINT [CK_PageReviews_Decision] CHECK  (([Decision]='rejected' OR [Decision]='revision_requested' OR [Decision]='approved'))
ALTER TABLE [dbo].[PageReviews] CHECK CONSTRAINT [CK_PageReviews_Decision]
ALTER TABLE [dbo].[PageRegions]  WITH CHECK ADD  CONSTRAINT [CK_PageRegions_Status] CHECK  (([Status]='completed' OR [Status]='in_progress' OR [Status]='pending'))
ALTER TABLE [dbo].[PageRegions] CHECK CONSTRAINT [CK_PageRegions_Status]
ALTER TABLE [dbo].[PageRegions]  WITH CHECK ADD  CONSTRAINT [CK_PageRegions_Type] CHECK  (([Type]='lettering' OR [Type]='coloring' OR [Type]='text' OR [Type]='effects' OR [Type]='background' OR [Type]='line_art'))
ALTER TABLE [dbo].[PageRegions] CHECK CONSTRAINT [CK_PageRegions_Type]
ALTER TABLE [dbo].[PageAnnotations]  WITH CHECK ADD  CONSTRAINT [CK_PageAnnotations_Status] CHECK  (([Status]='resolved' OR [Status]='open'))
ALTER TABLE [dbo].[PageAnnotations] CHECK CONSTRAINT [CK_PageAnnotations_Status]
ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [CK_Tasks_Status] CHECK  (([Status]='cancelled' OR [Status]='approved' OR [Status]='revision' OR [Status]='submitted' OR [Status]='in_progress' OR [Status]='pending'))
ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [CK_Tasks_Status]
ALTER TABLE [dbo].[Tasks]  WITH CHECK ADD  CONSTRAINT [CK_Tasks_Type] CHECK  (([Type]='review' OR [Type]='lettering' OR [Type]='coloring' OR [Type]='effects' OR [Type]='background' OR [Type]='line_art'))
ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT [CK_Tasks_Type]
ALTER TABLE [dbo].[PayrollRecords]  WITH CHECK ADD  CONSTRAINT [CK_PayrollRecords_Status] CHECK  (([Status]='failed' OR [Status]='paid' OR [Status]='processing' OR [Status]='pending'))
ALTER TABLE [dbo].[PayrollRecords] CHECK CONSTRAINT [CK_PayrollRecords_Status]
ALTER TABLE [dbo].[TaskSubmissions]  WITH CHECK ADD  CONSTRAINT [CK_TaskSubmissions_Status] CHECK  (([Status]='rejected' OR [Status]='revision_requested' OR [Status]='accepted' OR [Status]='submitted'))
ALTER TABLE [dbo].[TaskSubmissions] CHECK CONSTRAINT [CK_TaskSubmissions_Status]
