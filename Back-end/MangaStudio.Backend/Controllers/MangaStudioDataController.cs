using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MangaStudio.Backend.Data;
using MangaStudio.Backend.Models.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using MangaStudio.Backend.Models.DTOs;
using System.Security.Claims;

namespace MangaStudio.Backend.Controllers;

[ApiController]
[Route("api/data")]
[Authorize]
public class MangaStudioDataController : ControllerBase
{
    private const int ReaderVoteWarningThreshold = 22000;
    private readonly AppDbContext _dbContext;

    public MangaStudioDataController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    // GET api/data/series
    [HttpGet("series")]
    [Authorize(Roles = "mangaka,assistant,tantou,editorial")]
    public async Task<IActionResult> GetSeriesList()
    {
        var series = await _dbContext.Series
            .AsNoTracking()
            .Where(s => s.Status != "proposal")
            .Select(s => new
            {
                s.SeriesId,
                s.Title,
                s.TitleJp,
                Author = s.Mangaka != null ? s.Mangaka.FullName : "Yuki Tanaka",
                s.CreatedAt,
                s.UpdatedAt,
                Genres = s.SeriesGenres.Select(g => g.Genre).ToList(),
                Chapters = s.Chapters.Count(),
                Status = s.Status.ToLower(),
                Starred = s.Ranking.HasValue && s.Ranking <= 3,
                s.Ranking,
                s.Rating,
                s.ReaderCount,
                LatestReaderVote = s.ReaderVotes
                    .OrderByDescending(v => v.YearNumber)
                    .ThenByDescending(v => v.WeekNumber)
                    .Select(v => new
                    {
                        v.Votes,
                        v.WeekNumber,
                        v.YearNumber
                    })
                    .FirstOrDefault(),
                TotalReaderVotes = s.ReaderVotes.Sum(v => (int?)v.Votes) ?? 0,
                Revenue = s.Chapters
                    .SelectMany(c => c.MangaPages)
                    .SelectMany(p => p.Tasks)
                    .Sum(t => (decimal?)t.PaymentAmount) ?? 0m,
                s.CoverImageUrl,
                s.Synopsis,
                ProposalStatus = s.SeriesProposals
                    .OrderByDescending(p => p.SubmittedAt)
                    .Select(p => p.Status)
                    .FirstOrDefault(),
                ProposalFeedback = s.SeriesProposals
                    .OrderByDescending(p => p.SubmittedAt)
                    .Select(p => p.ReviewNote)
                    .FirstOrDefault(),
                Team = s.Chapters
                    .SelectMany(c => c.MangaPages)
                    .SelectMany(p => p.Tasks)
                    .Where(t => t.Assignee != null)
                    .Select(t => t.Assignee!.FullName)
                    .Distinct()
                    .ToList(),
                ApprovedCount = s.Chapters
                    .SelectMany(c => c.MangaPages)
                    .SelectMany(p => p.Tasks)
                    .Count(t => t.Status == "approved"),
                TodoCount = s.Chapters
                    .SelectMany(c => c.MangaPages)
                    .SelectMany(p => p.Tasks)
                    .Count(t => t.Status == "pending"),
                DoingCount = s.Chapters
                    .SelectMany(c => c.MangaPages)
                    .SelectMany(p => p.Tasks)
                    .Count(t => t.Status == "in_progress"),
                ReviewCount = s.Chapters
                    .SelectMany(c => c.MangaPages)
                    .SelectMany(p => p.Tasks)
                    .Count(t => t.Status == "submitted" || t.Status == "revision"),
                TotalCount = s.Chapters
                    .SelectMany(c => c.MangaPages)
                    .SelectMany(p => p.Tasks)
                    .Count()
            })
            .OrderByDescending(s => s.UpdatedAt)
            .ToListAsync();

        var result = series.Select(s => new
        {
            id      = s.SeriesId.ToString(),
            title   = s.Title,
            titleJp = s.TitleJp,
            author  = s.Author,
            createdAt = s.CreatedAt.ToString("dd/MM/yyyy"),
            createdAtRaw = s.CreatedAt,
            updatedAtRaw = s.UpdatedAt,
            genre   = s.Genres.Any()
                        ? string.Join(" / ", s.Genres)
                        : "General",
            genres  = s.Genres,
            chapters = s.Chapters,
            status   = s.Status,
            starred  = s.Starred,
            ranking  = s.Ranking,
            rating   = s.Rating,
            readerCount = s.ReaderCount,
            latestReaderVotes = s.LatestReaderVote?.Votes ?? 0,
            latestReaderVoteWeek = s.LatestReaderVote?.WeekNumber,
            latestReaderVoteYear = s.LatestReaderVote?.YearNumber,
            totalReaderVotes = s.TotalReaderVotes,
            revenue  = s.Revenue,
            coverImageUrl = s.CoverImageUrl,
            synopsis = s.Synopsis,
            proposalStatus = s.ProposalStatus,
            proposalFeedback = s.ProposalFeedback,
            team = s.Team,
            progress = s.Status == "completed" 
                ? 100 
                : s.TotalCount > 0
                    ? (int)Math.Round((double)s.ApprovedCount / s.TotalCount * 100)
                    : 0,
            todoCount = s.TodoCount,
            doingCount = s.DoingCount,
            reviewCount = s.ReviewCount,
            totalCount = s.TotalCount
        });

        return Ok(result);
    }

    // GET api/data/series-reader-votes
    [HttpGet("series-reader-votes")]
    [Authorize(Roles = "mangaka,assistant,tantou,editorial")]
    public async Task<IActionResult> GetSeriesReaderVotes()
    {
        var series = await _dbContext.Series
            .Where(s => s.Status != "proposal")
            .Include(s => s.Mangaka)
            .Include(s => s.Chapters)
            .Include(s => s.ReaderVotes)
            .ToListAsync();

        var result = series.Select(s =>
        {
            var latestReaderVote = s.ReaderVotes
                .OrderByDescending(v => v.YearNumber)
                .ThenByDescending(v => v.WeekNumber)
                .FirstOrDefault();

            return new
            {
                id = s.SeriesId.ToString(),
                title = s.Title,
                titleJp = s.TitleJp,
                author = s.Mangaka?.FullName ?? "Yuki Tanaka",
                chapters = s.Chapters.Count,
                status = s.Status.ToLower(),
                ranking = s.Ranking,
                rating = s.Rating,
                coverImageUrl = s.CoverImageUrl,
                updatedAtRaw = s.UpdatedAt,
                latestReaderVotes = latestReaderVote?.Votes ?? 0,
                latestReaderVoteWeek = latestReaderVote?.WeekNumber,
                latestReaderVoteYear = latestReaderVote?.YearNumber,
                totalReaderVotes = s.ReaderVotes.Sum(v => v.Votes)
            };
        });

        return Ok(result);
    }

    // GET api/data/dashboard-metrics?role=mangaka&userId=...
    [HttpGet("dashboard-metrics")]
    [Authorize(Roles = "mangaka,assistant,tantou,editorial")]
    public async Task<IActionResult> GetDashboardMetrics([FromQuery] string role, [FromQuery] Guid userId)
    {
        if (string.IsNullOrEmpty(role))
            return BadRequest("Role is required.");

        var currentUserId = GetCurrentUserId();
        if (currentUserId != Guid.Empty)
        {
            userId = currentUserId;
        }

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

                var latestVoteWeek = await _dbContext.ReaderVotes
                    .GroupBy(v => new { v.YearNumber, v.WeekNumber })
                    .OrderByDescending(g => g.Key.YearNumber)
                    .ThenByDescending(g => g.Key.WeekNumber)
                    .Select(g => new
                    {
                        g.Key.YearNumber,
                        g.Key.WeekNumber,
                        TotalVotes = g.Sum(v => (long)v.Votes)
                    })
                    .FirstOrDefaultAsync();

                var totalVotes = latestVoteWeek?.TotalVotes ?? 0;

                string? topSurveySeries = null;
                if (latestVoteWeek != null)
                {
                    topSurveySeries = await _dbContext.ReaderVotes
                        .Include(v => v.Series)
                        .Where(v => v.YearNumber == latestVoteWeek.YearNumber &&
                                    v.WeekNumber == latestVoteWeek.WeekNumber)
                        .OrderBy(v => v.RankNumber)
                        .Select(v => v.Series.Title)
                        .FirstOrDefaultAsync();
                }

                return Ok(new[]
                {
                    new { title = "New Proposals",     val = $"{proposals} pending",         change = "Awaiting decision",                                                               icon = "⚖️" },
                    new { title = "Reader Votes",      val = $"{(totalVotes / 1000.0):F1}K", change = latestVoteWeek == null ? "No survey imported yet" : $"Week {latestVoteWeek.WeekNumber}, {latestVoteWeek.YearNumber} survey", icon = "🗳️" },
                    new { title = "Top Survey Series", val = topSurveySeries ?? "N/A",       change = latestVoteWeek == null ? "No reader vote survey yet" : "Current survey leader",     icon = "🏆" }
                });
            }

            default:
                return BadRequest("Invalid role.");
        }
    }

    // GET api/data/reader-votes
     [HttpGet("reader-votes")]
     [Authorize(Roles = "editorial")]
     public async Task<IActionResult> GetReaderVotes([FromQuery] int? week, [FromQuery] int? year)
     {
         var currentWeek = week ?? System.Globalization.ISOWeek.GetWeekOfYear(DateTime.UtcNow);
         var currentYear = year ?? DateTime.UtcNow.Year;

         var previousSurvey = await _dbContext.ReaderVotes
             .Where(v =>
                 v.YearNumber < currentYear ||
                 (v.YearNumber == currentYear && v.WeekNumber < currentWeek))
             .GroupBy(v => new { v.YearNumber, v.WeekNumber })
             .OrderByDescending(g => g.Key.YearNumber)
             .ThenByDescending(g => g.Key.WeekNumber)
             .Select(g => new { g.Key.YearNumber, g.Key.WeekNumber })
             .FirstOrDefaultAsync();

         var currentVotes = await _dbContext.ReaderVotes
             .Include(v => v.Series)
                .ThenInclude(s => s.Mangaka)
             .Where(v => v.WeekNumber == currentWeek && v.YearNumber == currentYear)
             .OrderBy(v => v.RankNumber)
             .ToListAsync();

         Dictionary<Guid, (int votes, int rank)> previousVotesDict = previousSurvey == null
             ? new Dictionary<Guid, (int votes, int rank)>()
             : await _dbContext.ReaderVotes
                 .Where(v => v.WeekNumber == previousSurvey.WeekNumber && v.YearNumber == previousSurvey.YearNumber)
                 .ToDictionaryAsync(v => v.SeriesId, v => (v.Votes, v.RankNumber));

         var result = currentVotes.Select(v =>
         {
             var hasPrevious = previousVotesDict.TryGetValue(v.SeriesId, out var prev);
             var previousVotes = hasPrevious ? prev.votes : v.Votes;
             var previousRank = hasPrevious ? prev.rank : v.RankNumber;
             return new
             {
                 id            = v.ReaderVoteId.ToString(),
                 seriesId      = v.SeriesId.ToString(),
                 series        = v.Series.Title,
                 authorName    = v.Series.Mangaka?.FullName ?? "Yuki Tanaka",
                 coverImageUrl = v.Series.CoverImageUrl,
                 seriesStatus  = v.Series.Status,
                 votes         = v.Votes,
                 previousVotes = hasPrevious ? previousVotes : 0,
                 change        = v.Votes - previousVotes,
                 rank          = v.RankNumber,
                 previousRank  = previousRank,
                 warningThreshold = ReaderVoteWarningThreshold,
                 isBelowThreshold = v.Votes < ReaderVoteWarningThreshold,
                 periodLabel = $"Week {currentWeek}, {currentYear}",
                 previousPeriodLabel = previousSurvey == null ? null : $"Week {previousSurvey.WeekNumber}, {previousSurvey.YearNumber}"
             };
         });

         return Ok(result);
     }

    // GET api/data/reader-votes/history
    [HttpGet("reader-votes/history")]
    [Authorize(Roles = "editorial")]
    public async Task<IActionResult> GetReaderVoteHistory([FromQuery] int? year)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;

        var voteRows = await _dbContext.ReaderVotes
            .Include(v => v.Series)
                .ThenInclude(s => s.Mangaka)
            .Where(v => v.YearNumber == targetYear || v.YearNumber == targetYear - 1)
            .ToListAsync();

        var surveyGroups = voteRows
            .Where(v => v.YearNumber == targetYear)
            .GroupBy(v => new { v.YearNumber, v.WeekNumber })
            .OrderByDescending(g => g.Key.YearNumber)
            .ThenByDescending(g => g.Key.WeekNumber)
            .ToList();

        var allSurveyKeys = voteRows
            .GroupBy(v => new { v.YearNumber, v.WeekNumber })
            .Select(g => g.Key)
            .OrderByDescending(k => k.YearNumber)
            .ThenByDescending(k => k.WeekNumber)
            .ToList();

        var lookup = voteRows
            .GroupBy(v => new { v.YearNumber, v.WeekNumber, v.SeriesId })
            .ToDictionary(g => g.Key, g => g.First());

        var weeks = surveyGroups
            .Select(g =>
            {
                var ordered = g.OrderBy(v => v.RankNumber).ToList();
                var previousSurvey = allSurveyKeys
                    .Where(k =>
                        k.YearNumber < g.Key.YearNumber ||
                        (k.YearNumber == g.Key.YearNumber && k.WeekNumber < g.Key.WeekNumber))
                    .OrderByDescending(k => k.YearNumber)
                    .ThenByDescending(k => k.WeekNumber)
                    .FirstOrDefault();
                var top = ordered.FirstOrDefault();
                var importedAt = ordered
                    .OrderByDescending(v => v.CreatedAt)
                    .Select(v => v.CreatedAt)
                    .FirstOrDefault();

                return new
                {
                    year = g.Key.YearNumber,
                    week = g.Key.WeekNumber,
                    periodLabel = $"Week {g.Key.WeekNumber}, {g.Key.YearNumber}",
                    importedAt = importedAt == default ? (DateTime?)null : importedAt,
                    sourceFileName = "CSV import",
                    rowCount = ordered.Count,
                    totalVotes = ordered.Sum(v => v.Votes),
                    topSeries = top?.Series.Title ?? "N/A",
                    belowThresholdCount = ordered.Count(v => v.Votes < ReaderVoteWarningThreshold),
                    threshold = ReaderVoteWarningThreshold,
                    entries = ordered.Select(v =>
                    {
                        ReaderVote? previous = null;
                        if (previousSurvey != null)
                        {
                            lookup.TryGetValue(new { previousSurvey.YearNumber, previousSurvey.WeekNumber, v.SeriesId }, out previous);
                        }

                        return new
                        {
                            id = v.ReaderVoteId.ToString(),
                            seriesId = v.SeriesId.ToString(),
                            series = v.Series.Title,
                            authorName = v.Series.Mangaka?.FullName ?? "Yuki Tanaka",
                            coverImageUrl = v.Series.CoverImageUrl,
                            seriesStatus = v.Series.Status,
                            rank = v.RankNumber,
                            previousRank = previous?.RankNumber ?? v.RankNumber,
                            votes = v.Votes,
                            previousVotes = previous?.Votes ?? 0,
                            change = v.Votes - (previous?.Votes ?? v.Votes),
                            warningThreshold = ReaderVoteWarningThreshold,
                            isBelowThreshold = v.Votes < ReaderVoteWarningThreshold,
                            periodLabel = $"Week {g.Key.WeekNumber}, {g.Key.YearNumber}",
                            previousPeriodLabel = previousSurvey == null ? null : $"Week {previousSurvey.WeekNumber}, {previousSurvey.YearNumber}"
                        };
                    }).ToList()
                };
            })
            .ToList();

        return Ok(new
        {
            year = targetYear,
            threshold = ReaderVoteWarningThreshold,
            weeks
        });
    }

    // POST api/data/reader-votes
    [HttpPost("reader-votes")]
    [Authorize(Roles = "editorial")]
    public async Task<IActionResult> SaveWeeklyVotes([FromBody] SaveVotesDto dto)
    {
        if (dto == null || dto.WeekNumber < 1 || dto.WeekNumber > 53 || dto.YearNumber < 2000)
            return BadRequest("Invalid week or year number.");

        if (dto.Votes == null || !dto.Votes.Any())
            return BadRequest("Votes list cannot be empty.");

        // Remove existing votes for this week and year
        var existingVotes = await _dbContext.ReaderVotes
            .Where(v => v.WeekNumber == dto.WeekNumber && v.YearNumber == dto.YearNumber)
            .ToListAsync();

        if (existingVotes.Any())
        {
            _dbContext.ReaderVotes.RemoveRange(existingVotes);
        }

        // Order input votes by votes descending to assign rank numbers
        var sortedVotes = dto.Votes.OrderByDescending(v => v.Votes).ToList();

        var newVotesList = new List<ReaderVote>();
        for (int i = 0; i < sortedVotes.Count; i++)
        {
            var item = sortedVotes[i];
            newVotesList.Add(new ReaderVote
            {
                ReaderVoteId = Guid.NewGuid(),
                SeriesId = item.SeriesId,
                WeekNumber = dto.WeekNumber,
                YearNumber = dto.YearNumber,
                Votes = item.Votes,
                RankNumber = i + 1,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.ReaderVotes.AddRangeAsync(newVotesList);

        // Update the corresponding Series rankings in the Series table to stay in sync
        var seriesList = await _dbContext.Series
            .Where(s => s.Status != "proposal")
            .ToListAsync();
        foreach (var vote in newVotesList)
        {
            var series = seriesList.FirstOrDefault(s => s.SeriesId == vote.SeriesId);
            if (series != null)
            {
                series.Ranking = vote.RankNumber;
            }
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Weekly votes saved successfully." });
    }

    // POST api/data/reader-votes/import
    [HttpPost("reader-votes/import")]
    [Authorize(Roles = "editorial")]
    public async Task<IActionResult> ImportReaderVotes(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("CSV file is required.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".csv" && extension != ".txt")
            return BadRequest("Only .csv or .txt files are supported.");

        var series = await _dbContext.Series
            .Where(s => s.Status != "proposal")
            .ToListAsync();
        var byId = series.ToDictionary(s => s.SeriesId, s => s);
        var byTitle = series
            .GroupBy(s => s.Title.Trim().ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First());

        var importedRows = new List<(int Year, int Week, Guid SeriesId, int Votes)>();
        using (var stream = file.OpenReadStream())
        using (var reader = new StreamReader(stream))
        {
            var headerLine = await reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(headerLine))
                return BadRequest("CSV file is empty.");

            var headers = SplitCsvLine(headerLine)
                .Select((name, index) => new { Name = name.Trim().ToLowerInvariant(), Index = index })
                .ToDictionary(x => x.Name, x => x.Index);

            if (!headers.ContainsKey("year") || !headers.ContainsKey("week") || !headers.ContainsKey("votes") ||
                (!headers.ContainsKey("seriesid") && !headers.ContainsKey("seriestitle")))
            {
                return BadRequest("CSV must include year, week, votes, and either seriesId or seriesTitle.");
            }

            var lineNumber = 1;
            while (!reader.EndOfStream)
            {
                lineNumber++;
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line)) continue;

                var columns = SplitCsvLine(line);
                string Cell(string name) => headers.TryGetValue(name, out var index) && index < columns.Count ? columns[index].Trim() : "";

                if (!int.TryParse(Cell("year"), out var year) || year < 2000)
                    return BadRequest($"Invalid year at line {lineNumber}.");
                if (!int.TryParse(Cell("week"), out var week) || week < 1 || week > 53)
                    return BadRequest($"Invalid week at line {lineNumber}.");
                if (!int.TryParse(Cell("votes"), out var votes) || votes < 0)
                    return BadRequest($"Invalid votes at line {lineNumber}.");

                Series? matchedSeries = null;
                var seriesIdText = Cell("seriesid");
                if (!string.IsNullOrWhiteSpace(seriesIdText) && Guid.TryParse(seriesIdText, out var seriesId))
                    byId.TryGetValue(seriesId, out matchedSeries);

                if (matchedSeries == null)
                {
                    var title = Cell("seriestitle").ToLowerInvariant();
                    if (!string.IsNullOrWhiteSpace(title))
                        byTitle.TryGetValue(title, out matchedSeries);
                }

                if (matchedSeries == null)
                    return BadRequest($"Series was not found at line {lineNumber}.");

                importedRows.Add((year, week, matchedSeries.SeriesId, votes));
            }
        }

        if (!importedRows.Any())
            return BadRequest("No vote rows were found.");

        var affectedWeeks = importedRows
            .Select(r => new { r.Year, r.Week })
            .Distinct()
            .ToList();

        foreach (var affected in affectedWeeks)
        {
            var existing = await _dbContext.ReaderVotes
                .Where(v => v.YearNumber == affected.Year && v.WeekNumber == affected.Week)
                .ToListAsync();
            _dbContext.ReaderVotes.RemoveRange(existing);

            var ranked = importedRows
                .Where(r => r.Year == affected.Year && r.Week == affected.Week)
                .GroupBy(r => r.SeriesId)
                .Select(g => new { SeriesId = g.Key, Votes = g.Sum(x => x.Votes) })
                .OrderByDescending(x => x.Votes)
                .ToList();

            for (var i = 0; i < ranked.Count; i++)
            {
                var rank = i + 1;
                _dbContext.ReaderVotes.Add(new ReaderVote
                {
                    ReaderVoteId = Guid.NewGuid(),
                    SeriesId = ranked[i].SeriesId,
                    WeekNumber = affected.Week,
                    YearNumber = affected.Year,
                    Votes = ranked[i].Votes,
                    RankNumber = rank,
                    CreatedAt = DateTime.UtcNow
                });

                if (byId.TryGetValue(ranked[i].SeriesId, out var targetSeries))
                {
                    targetSeries.Ranking = rank;

                    if (ranked[i].Votes < ReaderVoteWarningThreshold)
                    {
                        var marker = $"Week {affected.Week}, {affected.Year}";
                        var alreadyWarned = await _dbContext.Notifications.AnyAsync(n =>
                            n.UserId == targetSeries.MangakaId &&
                            n.Type == "reader_vote_risk" &&
                            n.Link == "/votes" &&
                            n.Message.Contains(targetSeries.Title) &&
                            n.Message.Contains(marker));

                        if (!alreadyWarned)
                        {
                            _dbContext.Notifications.Add(new Notification
                            {
                                NotificationId = Guid.NewGuid(),
                                UserId = targetSeries.MangakaId,
                                Type = "reader_vote_risk",
                                Title = "Series below reader vote threshold",
                                Message = $"{targetSeries.Title} received {ranked[i].Votes:N0} votes in {marker}, below the threshold of {ReaderVoteWarningThreshold:N0}. Review the next release plan with Tantou.",
                                IsRead = false,
                                Link = "/votes",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }
            }
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            message = "Reader votes imported successfully.",
            rows = importedRows.Count,
            weeks = affectedWeeks.Count,
            importedWeeks = affectedWeeks
                .OrderByDescending(w => w.Year)
                .ThenByDescending(w => w.Week)
                .Select(w => new { year = w.Year, week = w.Week })
                .ToList()
        });
    }

    private static List<string> SplitCsvLine(string line)
    {
        var values = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var ch = line[i];
            if (ch == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (ch == ',' && !inQuotes)
            {
                values.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(ch);
            }
        }

        values.Add(current.ToString());
        return values;
    }

    // GET api/data/publish-schedule
    [HttpGet("publish-schedule")]
    [Authorize(Roles = "tantou,editorial")]
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
    [Authorize(Roles = "mangaka,tantou")]
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
    [Authorize(Roles = "mangaka,assistant")]
    public async Task<IActionResult> GetPayroll()
    {
        var payrollQuery = _dbContext.PayrollRecords
            .Include(p => p.Assistant)
            .ThenInclude(a => a.AssistantProfile)
            .Include(p => p.Task)
            .AsQueryable();

        if (User.IsInRole("assistant"))
        {
            var assistantId = GetCurrentUserId();
            payrollQuery = payrollQuery.Where(p => p.AssistantId == assistantId);
        }
        else if (User.IsInRole("mangaka"))
        {
            var mangakaId = GetCurrentUserId();
            payrollQuery = payrollQuery.Where(p => p.Task != null && p.Task.AssignerId == mangakaId);
        }

        var payrolls = await payrollQuery
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
    [Authorize(Roles = "mangaka,assistant,tantou,editorial")]
    public async Task<IActionResult> GetTasks()
    {
        var taskQuery = _dbContext.Tasks
            .AsNoTracking()
            .Where(t => t.Page.Chapter.Series.Status != "proposal")
            .AsQueryable();

        var currentUserId = GetCurrentUserId();
        if (User.IsInRole("assistant"))
        {
            taskQuery = taskQuery.Where(t => t.AssigneeId == currentUserId);
        }
        else if (User.IsInRole("mangaka"))
        {
            taskQuery = taskQuery.Where(t => t.AssignerId == currentUserId);
        }

        var result = await taskQuery
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                id           = t.TaskId.ToString(),
                title        = t.Title,
                description  = t.Description,
                type         = t.Type.ToLower(),
                pageId       = t.PageId.ToString(),
                pageNumber   = t.Page.PageNumber,
                regionId     = t.RegionId != null ? t.RegionId.ToString() : null,
                regionType   = t.Region != null ? t.Region.Type : null,
                regionX      = t.Region != null ? (double?)t.Region.X : null,
                regionY      = t.Region != null ? (double?)t.Region.Y : null,
                regionWidth  = t.Region != null ? (double?)t.Region.Width : null,
                regionHeight = t.Region != null ? (double?)t.Region.Height : null,
                assigneeId   = t.AssigneeId != null ? t.AssigneeId.ToString() : null,
                assigneeName = t.Assignee != null ? t.Assignee.FullName : "Unassigned",
                assigneeAvatar = t.Assignee != null ? t.Assignee.Avatar : null,
                status       = t.Status.ToLower(),
                dueDate      = t.DueDate != null ? t.DueDate.Value.ToString("yyyy-MM-dd") : null,
                payment      = (double)t.PaymentAmount,
                chapterNumber  = t.Page.Chapter.ChapterNumber,
                seriesTitle    = t.Page.Chapter.Series.Title
            })
            .ToListAsync();

        return Ok(result);
    }

    // GET api/data/review-series
    [HttpGet("review-series")]
    [Authorize(Roles = "mangaka,tantou")]
    public async Task<IActionResult> GetReviewSeriesList()
    {
        var seriesList = await _dbContext.Series
            .Include(s => s.Mangaka)
            .Include(s => s.SeriesGenres)
            .Include(s => s.Chapters)
                .ThenInclude(c => c.MangaPages)
            .Where(s => s.Status != "proposal" && s.Chapters.Any(c => c.MangaPages.Any(p => p.Status == "review" || p.Status == "submitted")))
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
    [Authorize(Roles = "mangaka,tantou")]
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
            .Include(p => p.PageVersions)
            .Include(p => p.ReviewComments)
                .ThenInclude(c => c.User)
            .Include(p => p.Chapter)
                .ThenInclude(c => c.Series)
            .Where(p => p.Chapter.Series.Status != "proposal")
            .OrderBy(p => p.PageNumber)
            .ToListAsync();

        var result = pages.Select(p =>
        {
            var currentVersionId = GetCurrentVersionId(p);
            var currentAnnotations = p.PageAnnotations
                .Where(a => a.Status == "open" && a.PageVersionId == currentVersionId)
                .ToList();

            return new
        {
            id             = p.PageId.ToString(),
            number         = p.PageNumber,
            status         = p.Status.ToLower(),
            imageUrl       = p.CurrentImageUrl,
            chapterId      = p.ChapterId.ToString(),
            chapterNumber  = p.Chapter.ChapterNumber,
            seriesId       = p.Chapter.SeriesId.ToString(),
            seriesTitle    = p.Chapter.Series.Title,
            hasAnnotations = currentAnnotations.Any(),
            annotations = currentAnnotations.Select(a => new
            {
                id           = a.AnnotationId.ToString(),
                pageVersionId = a.PageVersionId?.ToString(),
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
                createdAt = c.CreatedAt
            })
        };
        });

        return Ok(result);
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    // GET api/data/chapter-review-queue
    [HttpGet("chapter-review-queue")]
    [Authorize(Roles = "tantou")]
    public async Task<IActionResult> GetChapterReviewQueue()
    {
        var tantouId = GetCurrentUserId();

        var chapters = await _dbContext.Chapters
            .Include(c => c.Series)
                .ThenInclude(s => s.Mangaka)
            .Include(c => c.MangaPages)
                .ThenInclude(p => p.PageAnnotations)
            .Include(c => c.MangaPages)
                .ThenInclude(p => p.PageVersions)
            .Include(c => c.MangaPages)
                .ThenInclude(p => p.ReviewComments)
                    .ThenInclude(c => c.User)
            .Where(c => c.Series.TantouId == tantouId && c.Status == "tantou_review")
            .OrderBy(c => c.SubmittedForPublishingAt ?? c.UpdatedAt)
            .ToListAsync();

        var result = chapters.Select(c => new
        {
            chapterId = c.ChapterId.ToString(),
            chapterNumber = c.ChapterNumber,
            title = c.Title,
            status = c.Status,
            dueDate = c.DueDate.HasValue ? c.DueDate.Value.ToString("yyyy-MM-dd") : null,
            submittedForPublishingAt = c.SubmittedForPublishingAt,
            tantouReviewNote = c.TantouReviewNote,
            seriesId = c.SeriesId.ToString(),
            seriesTitle = c.Series.Title,
            author = c.Series.Mangaka.FullName,
            coverImageUrl = c.Series.CoverImageUrl,
            pageCount = c.MangaPages.Count,
            pages = c.MangaPages
                .OrderBy(p => p.PageNumber)
                .Select(p =>
                {
                    var currentVersionId = GetCurrentVersionId(p);
                    var currentAnnotations = p.PageAnnotations
                        .Where(a => a.Status == "open" && a.PageVersionId == currentVersionId)
                        .ToList();

                    return new
                {
                    id = p.PageId.ToString(),
                    number = p.PageNumber,
                    status = p.Status.ToLower(),
                    imageUrl = p.CurrentImageUrl,
                    chapterId = p.ChapterId.ToString(),
                    hasAnnotations = currentAnnotations.Any(),
                    annotations = currentAnnotations.Select(a => new
                    {
                        id = a.AnnotationId.ToString(),
                        pageVersionId = a.PageVersionId?.ToString(),
                        createdById = a.CreatedById.ToString(),
                        x = (double)a.X,
                        y = (double)a.Y,
                        width = (double?)a.Width,
                        height = (double?)a.Height,
                        body = a.Body,
                        status = a.Status.ToLower()
                    }),
                    comments = p.ReviewComments.Select(rc => new
                    {
                        id = rc.CommentId.ToString(),
                        userId = rc.UserId.ToString(),
                        userName = rc.User.FullName,
                        avatar = rc.User.Avatar,
                        body = rc.Body,
                        createdAt = rc.CreatedAt
                    })
                };
                })
        });

        return Ok(result);
    }

    private static Guid? GetCurrentVersionId(MangaPage page)
    {
        return page.PageVersions
            .OrderByDescending(v => v.VersionNumber)
            .FirstOrDefault(v => v.FileUrl == page.CurrentImageUrl)?.PageVersionId;
    }

}
