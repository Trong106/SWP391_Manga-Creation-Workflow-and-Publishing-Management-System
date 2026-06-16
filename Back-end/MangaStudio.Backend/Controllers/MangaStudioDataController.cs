using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MangaStudio.Backend.Data;
using MangaStudio.Backend.Models.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;

namespace MangaStudio.Backend.Controllers;

[ApiController]
[Route("api/data")]
[AllowAnonymous]
public class MangaStudioDataController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public MangaStudioDataController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // GET api/data/series
    [HttpGet("series")]
    public async Task<IActionResult> GetSeriesList()
    {
        var series = await _dbContext.Series
            .Include(s => s.Mangaka)
            .Include(s => s.SeriesGenres)
            .Include(s => s.Chapters)
                .ThenInclude(c => c.MangaPages)
                    .ThenInclude(p => p.Tasks)
                        .ThenInclude(t => t.Assignee)
            .ToListAsync();

        var result = series.Select(s => new
        {
            id      = s.SeriesId.ToString(),
            title   = s.Title,
            titleJp = s.TitleJp,
            author  = s.Mangaka?.FullName ?? "Yuki Tanaka",
            createdAt = s.CreatedAt.ToString("dd/MM/yyyy"),
            createdAtRaw = s.CreatedAt,
            updatedAtRaw = s.UpdatedAt,
            genre   = s.SeriesGenres.Any()
                        ? string.Join(" / ", s.SeriesGenres.Select(g => g.Genre))
                        : "General",
            genres  = s.SeriesGenres.Select(g => g.Genre).ToList(),
            chapters = s.Chapters.Count,
            status   = s.Status.ToLower(),
            starred  = s.Ranking.HasValue && s.Ranking <= 3,
            ranking  = s.Ranking,
            rating   = s.Rating,
            readerCount = s.ReaderCount,
            revenue  = s.ReaderCount * 0.15,
            coverImageUrl = s.CoverImageUrl,
            synopsis = s.Synopsis,
            team = s.Chapters
                .SelectMany(c => c.MangaPages)
                .SelectMany(p => p.Tasks)
                .Where(t => t.Assignee != null)
                .Select(t => t.Assignee!.FullName)
                .Distinct()
                .ToList(),
            progress = s.Status.ToLower() == "completed" 
                ? 100 
                : s.Chapters.SelectMany(c => c.MangaPages).SelectMany(p => p.Tasks).Any()
                    ? (int)Math.Round((double)s.Chapters.SelectMany(c => c.MangaPages).SelectMany(p => p.Tasks).Count(t => t.Status == "approved") / s.Chapters.SelectMany(c => c.MangaPages).SelectMany(p => p.Tasks).Count() * 100)
                    : 0
        });

        return Ok(result);
    }

    // GET api/data/dashboard-metrics?role=mangaka&userId=...
    [HttpGet("dashboard-metrics")]
    public async Task<IActionResult> GetDashboardMetrics([FromQuery] string role, [FromQuery] Guid userId)
    {
        if (string.IsNullOrEmpty(role))
            return BadRequest("Role is required.");

        switch (role.ToLower())
        {
            case "mangaka":
            {
                var activeSeries = await _dbContext.Series
                    .CountAsync(s => s.MangakaId == userId && s.Status == "active");

                var assistants = await _dbContext.Tasks
                    .Where(t => t.AssignerId == userId && t.AssigneeId != null)
                    .Select(t => t.AssigneeId)
                    .Distinct()
                    .CountAsync();

                var pagesUploaded = await _dbContext.MangaPages
                    .CountAsync(p => p.UploadedById == userId);

                // Count total pages across all series owned by mangaka (for target calculation)
                var totalSeriesPages = await _dbContext.MangaPages
                    .Where(p => p.Chapter.Series.MangakaId == userId)
                    .CountAsync();

                return Ok(new[]
                {
                    new { title = "Active Series",   val = activeSeries.ToString(),  change = $"{activeSeries} currently running", icon = "📚" },
                    new { title = "Team Members",    val = assistants.ToString(),     change = $"{assistants} assistants active",  icon = "👥" },
                    new { title = "Pages Uploaded",  val = pagesUploaded.ToString(),  change = $"{totalSeriesPages} pages total",  icon = "📄" }
                });
            }

            case "assistant":
            {
                var assignedTasks = await _dbContext.Tasks
                    .CountAsync(t => t.AssigneeId == userId && (t.Status == "pending" || t.Status == "in_progress"));

                var nextDue = await _dbContext.Tasks
                    .Where(t => t.AssigneeId == userId && t.Status == "in_progress" && t.DueDate != null)
                    .OrderBy(t => t.DueDate)
                    .Select(t => t.DueDate)
                    .FirstOrDefaultAsync();

                var totalEarned = await _dbContext.Tasks
                    .Where(t => t.AssigneeId == userId && t.Status == "approved")
                    .SumAsync(t => t.PaymentAmount);

                var downloadedPages = await _dbContext.MangaPages
                    .Where(p => p.Tasks.Any(t => t.AssigneeId == userId && t.Status != "pending"))
                    .CountAsync();

                return Ok(new[]
                {
                    new { title = "Assigned Tasks",    val = $"{assignedTasks} pending",      change = nextDue.HasValue ? $"Next due {nextDue.Value:MMM d}" : "No upcoming deadline", icon = "📋" },
                    new { title = "Downloaded Pages",  val = $"{downloadedPages} pages",       change = "Ready to process",                                                              icon = "💾" },
                    new { title = "Earned Payroll",    val = $"${totalEarned:F2}",              change = "Approved tasks total",                                                          icon = "💰" }
                });
            }

            case "tantou":
            {
                var reviewPages = await _dbContext.MangaPages
                    .CountAsync(p => p.Status == "review" || p.Status == "submitted");

                var totalPages = await _dbContext.MangaPages.CountAsync();

                var approvedPages = await _dbContext.MangaPages
                    .CountAsync(p => p.Status == "approved");

                var progressPct = totalPages > 0 ? (int)((double)approvedPages / totalPages * 100) : 0;

                var scheduledCount = await _dbContext.PublishSchedules
                    .CountAsync(s => s.Status == "scheduled");

                var latestReviewChapter = await _dbContext.MangaPages
                    .Where(p => p.Status == "review" || p.Status == "submitted")
                    .OrderByDescending(p => p.Chapter.ChapterNumber)
                    .Select(p => p.Chapter.ChapterNumber)
                    .FirstOrDefaultAsync();

                return Ok(new[]
                {
                    new { title = "Studio Progress", val = $"{progressPct}%",                        change = latestReviewChapter > 0 ? $"Chapter {latestReviewChapter} in review" : "No chapters in review", icon = "📉" },
                    new { title = "Pages to Review", val = $"{reviewPages} pages",                   change = "Pending annotation",                                                                             icon = "👀" },
                    new { title = "Publish Status",  val = scheduledCount > 0 ? "Scheduled" : "Up to date", change = $"{scheduledCount} upcoming",                                                        icon = "🚀" }
                });
            }

            case "editorial":
            {
                var proposals = await _dbContext.SeriesProposals
                    .CountAsync(p => p.Status == "submitted");

                var totalVotes = await _dbContext.ReaderVotes.SumAsync(v => (long)v.Votes);

                var topSeries = await _dbContext.Series
                    .Where(s => s.Ranking == 1)
                    .Select(s => s.Title)
                    .FirstOrDefaultAsync();

                var topRankValue = await _dbContext.Series
                    .Where(s => s.Ranking != null)
                    .OrderBy(s => s.Ranking)
                    .Select(s => s.Ranking)
                    .FirstOrDefaultAsync();

                return Ok(new[]
                {
                    new { title = "New Proposals",  val = $"{proposals} pending",              change = "Awaiting decision",                                     icon = "⚖️" },
                    new { title = "Reader Votes",   val = $"{(totalVotes / 1000.0):F1}K",      change = "Total accumulated votes",                               icon = "🗳️" },
                    new { title = "Global Ranking", val = topRankValue.HasValue ? $"Top {topRankValue}" : "N/A", change = topSeries ?? "No ranked series yet",   icon = "🏆" }
                });
            }

            default:
                return BadRequest("Invalid role.");
        }
    }

    // GET api/data/audit-logs
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs()
    {
        var logs = await _dbContext.AuditLogs
            .Include(l => l.User!)
            .ThenInclude(u => u.Role)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        var result = logs.Select(l => new
        {
            id = l.AuditLogId.ToString(),
            user = new
            {
                name   = l.User != null ? l.User.FullName : "System",
                avatar = l.User?.Avatar,
                role   = l.User?.Role?.Name ?? "Automated"
            },
            action     = l.Action,
            entityType = l.EntityType,
            entityName = l.EntityId.HasValue
                ? $"{l.EntityType} (ID: {l.EntityId.Value.ToString()[..8]})"
                : l.EntityType,
            details   = l.DetailsJson ?? "No additional details available.",
            timestamp = GetRelativeTime(l.CreatedAt),
            category  = GetCategory(l.EntityType)
        });

        return Ok(result);
    }

    // GET api/data/reader-votes
    [HttpGet("reader-votes")]
    public async Task<IActionResult> GetReaderVotes()
    {
        // Get current week votes
        var currentWeek = System.Globalization.ISOWeek.GetWeekOfYear(DateTime.UtcNow);
        var currentYear = DateTime.UtcNow.Year;
        var previousWeek = currentWeek > 1 ? currentWeek - 1 : 52;
        var previousYear = currentWeek > 1 ? currentYear : currentYear - 1;

        var currentVotes = await _dbContext.ReaderVotes
            .Include(v => v.Series)
            .Where(v => v.WeekNumber == currentWeek && v.YearNumber == currentYear)
            .OrderBy(v => v.RankNumber)
            .ToListAsync();

        // Get previous week votes for comparison
        var previousVotesDict = await _dbContext.ReaderVotes
            .Where(v => v.WeekNumber == previousWeek && v.YearNumber == previousYear)
            .ToDictionaryAsync(v => v.SeriesId, v => new { votes = v.Votes, rank = v.RankNumber });

        var result = currentVotes.Select(v =>
        {
            previousVotesDict.TryGetValue(v.SeriesId, out var prev);
            return new
            {
                id            = v.ReaderVoteId.ToString(),
                seriesId      = v.SeriesId.ToString(),
                series        = v.Series.Title,
                votes         = v.Votes,
                previousVotes = prev?.votes ?? 0,
                change        = v.Votes - (prev?.votes ?? v.Votes),
                rank          = v.RankNumber,
                previousRank  = prev?.rank ?? v.RankNumber
            };
        });

        return Ok(result);
    }

    // POST api/data/reader-votes
    [HttpPost("reader-votes")]
    public async Task<IActionResult> SaveWeeklyVotes([FromBody] WeeklyVotesSubmitDto dto)
    {
        if (dto == null || dto.Votes == null || !dto.Votes.Any())
            return BadRequest("Invalid vote data.");

        var sortedVotes = dto.Votes.OrderByDescending(v => v.Votes).ToList();

        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var existingVotes = await _dbContext.ReaderVotes
                .Where(v => v.WeekNumber == dto.WeekNumber && v.YearNumber == dto.YearNumber)
                .ToListAsync();
            _dbContext.ReaderVotes.RemoveRange(existingVotes);
            await _dbContext.SaveChangesAsync();

            for (int i = 0; i < sortedVotes.Count; i++)
            {
                var vote = sortedVotes[i];
                var newVote = new ReaderVote
                {
                    ReaderVoteId = Guid.NewGuid(),
                    SeriesId = vote.SeriesId,
                    WeekNumber = dto.WeekNumber,
                    YearNumber = dto.YearNumber,
                    Votes = vote.Votes,
                    RankNumber = i + 1,
                    CreatedAt = DateTime.UtcNow
                };

                var series = await _dbContext.Series.FindAsync(vote.SeriesId);
                if (series != null)
                {
                    series.Ranking = i + 1;
                    series.UpdatedAt = DateTime.UtcNow;
                }

                _dbContext.ReaderVotes.Add(newVote);
            }

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Weekly votes saved successfully." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    // GET api/data/publish-schedule
    [HttpGet("publish-schedule")]
    public async Task<IActionResult> GetPublishSchedule()
    {
        var schedules = await _dbContext.PublishSchedules
            .Include(s => s.Chapter)
            .ThenInclude(c => c.Series)
            .OrderBy(s => s.ScheduledDate)
            .ToListAsync();

        var result = schedules.Select(s => new
        {
            id      = s.PublishScheduleId.ToString(),
            series  = s.Chapter.Series.Title,
            chapter = s.Chapter.ChapterNumber,
            status  = s.Status.ToLower(),
            time    = s.ScheduledDate.ToString("HH:mm"),
            day     = s.ScheduledDate.Day,
            date    = s.ScheduledDate.ToString("yyyy-MM-dd")
        });

        return Ok(result);
    }

    // GET api/data/team
    [HttpGet("team")]
    public async Task<IActionResult> GetTeam()
    {
        var assistants = await _dbContext.Users
            .Include(u => u.Role)
            .Include(u => u.AssistantProfile)
            .Where(u => u.Role.Code == "assistant")
            .ToListAsync();

        var assistantIds = assistants.Select(a => a.UserId).ToList();

        // Batch-load task counts to avoid N+1
        var completedTaskCounts = await _dbContext.Tasks
            .Where(t => assistantIds.Contains(t.AssigneeId!.Value) && t.Status == "approved")
            .GroupBy(t => t.AssigneeId!.Value)
            .Select(g => new { AssistantId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.AssistantId, x => x.Count);

        var currentTaskCounts = await _dbContext.Tasks
            .Where(t => assistantIds.Contains(t.AssigneeId!.Value) && t.Status == "in_progress")
            .GroupBy(t => t.AssigneeId!.Value)
            .Select(g => new { AssistantId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.AssistantId, x => x.Count);

        var result = assistants.Select(a => new
        {
            id             = a.UserId.ToString(),
            name           = a.FullName,
            avatar         = a.Avatar,
            email          = a.Email,
            role           = a.AssistantProfile?.Specialty ?? "Assistant",
            specialty      = a.AssistantProfile?.Specialty ?? "General Assistant",
            rating         = a.AssistantProfile?.Rating,
            tasksCompleted = completedTaskCounts.TryGetValue(a.UserId, out var done) ? done : 0,
            currentTasks   = currentTaskCounts.TryGetValue(a.UserId, out var inProg) ? inProg : 0,
            hourlyRate     = a.AssistantProfile?.HourlyRate,
            status         = a.IsActive ? "active" : "inactive"
        });

        return Ok(result);
    }

    // GET api/data/payroll
    [HttpGet("payroll")]
    public async Task<IActionResult> GetPayroll()
    {
        var payrolls = await _dbContext.PayrollRecords
            .Include(p => p.Assistant)
            .ThenInclude(a => a.AssistantProfile)
            .OrderByDescending(p => p.PeriodEnd)
            .ToListAsync();

        var result = new List<object>();

        foreach (var p in payrolls)
        {
            var tasksCompleted = await _dbContext.Tasks.CountAsync(t =>
                t.AssigneeId == p.AssistantId &&
                t.Status == "approved" &&
                t.DueDate != null &&
                t.DueDate.Value >= p.PeriodStart &&
                t.DueDate.Value <= p.PeriodEnd);

            var pagesCompleted = await _dbContext.Tasks
                .Where(t =>
                    t.AssigneeId == p.AssistantId &&
                    t.Status == "approved" &&
                    t.DueDate != null &&
                    t.DueDate.Value >= p.PeriodStart &&
                    t.DueDate.Value <= p.PeriodEnd)
                .Select(t => t.PageId)
                .Distinct()
                .CountAsync();

            result.Add(new
            {
                id              = p.PayrollRecordId.ToString(),
                assistantId     = p.AssistantId.ToString(),
                assistantName   = p.Assistant.FullName,
                assistantAvatar = p.Assistant.Avatar,
                role            = p.Assistant.AssistantProfile?.Specialty ?? "Assistant",
                period          = $"{p.PeriodStart:MMM d} - {p.PeriodEnd:MMM d, yyyy}",
                tasksCompleted  = tasksCompleted,
                pagesCompleted  = pagesCompleted,
                baseRate        = (double)p.BaseAmount,
                bonuses         = (double)p.BonusAmount,
                deductions      = (double)p.DeductionAmount,
                totalAmount     = (double)(p.TotalAmount ?? p.BaseAmount + p.BonusAmount - p.DeductionAmount),
                status          = p.Status.ToLower(),
                paidDate        = p.PaidAt?.ToString("yyyy-MM-dd")
            });
        }

        return Ok(result);
    }

    // GET api/data/tasks
    [HttpGet("tasks")]
    public async Task<IActionResult> GetTasks()
    {
        var tasksList = await _dbContext.Tasks
            .Include(t => t.Page)
                .ThenInclude(p => p.Chapter)
                    .ThenInclude(c => c.Series)
            .Include(t => t.Assignee)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var result = tasksList.Select(t => new
        {
            id           = t.TaskId.ToString(),
            title        = t.Title,
            description  = t.Description,
            type         = t.Type.ToLower(),
            pageId       = t.PageId.ToString(),
            pageNumber   = t.Page.PageNumber,
            regionId     = t.RegionId?.ToString(),
            assigneeId   = t.AssigneeId?.ToString(),
            assigneeName = t.Assignee?.FullName ?? "Unassigned",
            assigneeAvatar = t.Assignee?.Avatar,
            status       = t.Status.ToLower(),
            dueDate      = t.DueDate?.ToString("yyyy-MM-dd"),
            payment      = (double)t.PaymentAmount,
            chapterNumber  = t.Page?.Chapter?.ChapterNumber ?? 0,
            seriesTitle    = t.Page?.Chapter?.Series?.Title
        });

        return Ok(result);
    }

    // GET api/data/review-series
    [HttpGet("review-series")]
    public async Task<IActionResult> GetReviewSeriesList()
    {
        var seriesList = await _dbContext.Series
            .Include(s => s.Mangaka)
            .Include(s => s.SeriesGenres)
            .Include(s => s.Chapters)
                .ThenInclude(c => c.MangaPages)
            .Where(s => s.Chapters.Any(c => c.MangaPages.Any(p => p.Status == "review" || p.Status == "submitted")))
            .ToListAsync();

        var result = seriesList
            .Select(s => {
                var oldestPageUploadedAt = s.Chapters
                    .SelectMany(c => c.MangaPages)
                    .Where(p => (p.Status == "review" || p.Status == "submitted") && p.UploadedAt.HasValue)
                    .OrderBy(p => p.UploadedAt)
                    .Select(p => p.UploadedAt)
                    .FirstOrDefault();

                return new {
                    Series = s,
                    OldestUploadedAt = oldestPageUploadedAt ?? DateTime.MaxValue
                };
            })
            .OrderBy(x => x.OldestUploadedAt)
            .Select(x => new
            {
                id      = x.Series.SeriesId.ToString(),
                title   = x.Series.Title,
                titleJp = x.Series.TitleJp,
                author  = x.Series.Mangaka?.FullName ?? "Yuki Tanaka",
                createdAt = x.Series.CreatedAt.ToString("dd/MM/yyyy"),
                genre   = x.Series.SeriesGenres.Any()
                            ? string.Join(" / ", x.Series.SeriesGenres.Select(g => g.Genre))
                            : "General",
                genres  = x.Series.SeriesGenres.Select(g => g.Genre).ToList(),
                chapters = x.Series.Chapters.Count,
                status   = x.Series.Status.ToLower(),
                readerCount = x.Series.ReaderCount,
                coverImageUrl = x.Series.CoverImageUrl,
                synopsis = x.Series.Synopsis,
                oldestReviewPageTime = x.OldestUploadedAt == DateTime.MaxValue ? null : x.OldestUploadedAt.ToString("yyyy-MM-dd HH:mm:ss")
            })
            .ToList();

        return Ok(result);
    }

    // GET api/data/review-pages?chapterId=...
    [HttpGet("review-pages")]
    public async Task<IActionResult> GetReviewPages([FromQuery] Guid? chapterId)
    {
        IQueryable<MangaPage> query = _dbContext.MangaPages;

        if (chapterId != null && chapterId != Guid.Empty)
        {
            query = query.Where(p => p.ChapterId == chapterId.Value);
        }
        else
        {
            query = query.Where(p => p.Status == "review" || p.Status == "submitted");
        }

        var pages = await query
            .Include(p => p.PageAnnotations)
            .Include(p => p.ReviewComments)
                .ThenInclude(c => c.User)
            .Include(p => p.Chapter)
                .ThenInclude(c => c.Series)
            .OrderBy(p => p.PageNumber)
            .ToListAsync();

        var result = pages.Select(p => new
        {
            id             = p.PageId.ToString(),
            number         = p.PageNumber,
            status         = p.Status.ToLower(),
            imageUrl       = p.CurrentImageUrl,
            chapterId      = p.ChapterId.ToString(),
            chapterNumber  = p.Chapter.ChapterNumber,
            seriesId       = p.Chapter.SeriesId.ToString(),
            seriesTitle    = p.Chapter.Series.Title,
            hasAnnotations = p.PageAnnotations.Any(),
            annotations = p.PageAnnotations.Select(a => new
            {
                id           = a.AnnotationId.ToString(),
                createdById  = a.CreatedById.ToString(),
                x            = (double)a.X,
                y            = (double)a.Y,
                width        = (double?)a.Width,
                height       = (double?)a.Height,
                body         = a.Body,
                status       = a.Status.ToLower()
            }),
            comments = p.ReviewComments.Select(c => new
            {
                id        = c.CommentId.ToString(),
                userId    = c.UserId.ToString(),
                userName  = c.User.FullName,
                avatar    = c.User.Avatar,
                body      = c.Body,
                createdAt = GetRelativeTime(c.CreatedAt)
            })
        });

        return Ok(result);
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    private static string GetCategory(string entityType) =>
        entityType.ToLower() switch
        {
            "series"  => "series",
            "chapter" => "chapter",
            "user"    => "user",
            "payment" => "payment",
            _         => "system"
        };

    private static string GetRelativeTime(DateTime dateTime)
    {
        var span = DateTime.UtcNow - dateTime;
        if (span.TotalDays > 365)  return $"{(int)(span.TotalDays / 365)} year(s) ago";
        if (span.TotalDays > 30)   return $"{(int)(span.TotalDays / 30)} month(s) ago";
        if (span.TotalDays > 7)    return $"{(int)(span.TotalDays / 7)} week(s) ago";
        if (span.TotalDays >= 1)   return $"{(int)span.TotalDays} day(s) ago";
        if (span.TotalHours >= 1)  return $"{(int)span.TotalHours} hour(s) ago";
        if (span.TotalMinutes >= 1) return $"{(int)span.TotalMinutes} minute(s) ago";
        return "just now";
    }
}

public class VoteInputDto
{
    public Guid SeriesId { get; set; }
    public int Votes { get; set; }
}

public class WeeklyVotesSubmitDto
{
    public int WeekNumber { get; set; }
    public int YearNumber { get; set; }
    public List<VoteInputDto> Votes { get; set; }
}
