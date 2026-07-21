using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MangaStudio.Backend.Services.Interfaces;
using MangaStudio.Backend.Models.DTOs;
using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace MangaStudio.Backend.Controllers;

/// <summary>
/// Controller quản lý bộ truyện (Series) và chương (Chapter) bên trong nó.
/// </summary>
[ApiController]
[Route("api/series")]
[Authorize]
public class SeriesController : ControllerBase
{
    private readonly ISeriesService _seriesService;
    private readonly IChapterService _chapterService;
    private readonly IStorageService _storageService;

    public SeriesController(ISeriesService seriesService, IChapterService chapterService, IStorageService storageService)
    {
        _seriesService = seriesService;
        _chapterService = chapterService;
        _storageService = storageService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Guid.Empty;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    /// <summary>
    /// GET /api/series — Lấy catalog bộ truyện cho mọi role đã đăng nhập.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMySeries()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _seriesService.GetSeriesCatalog(
                userId,
                User.IsInRole("mangaka"),
                User.IsInRole("editorial")
            );
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/series/{id} — Xem chi tiết bộ truyện.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSeriesById(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _seriesService.GetSeriesById(id, userId);
            if (result.Status.Equals("proposal", StringComparison.OrdinalIgnoreCase) &&
                result.MangakaId != userId &&
                !User.IsInRole("editorial"))
            {
                return Forbid();
            }
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/series — Tạo bộ truyện mới.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> CreateSeries([FromBody] CreateSeriesDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var mangakaId = GetCurrentUserId();
            var result = await _seriesService.CreateSeries(mangakaId, dto);
            return StatusCode(201, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/series/with-manuscript — Tạo proposal và lưu bản thảo sơ bộ thành Chapter 1.
    /// </summary>
    [HttpPost("with-manuscript")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> CreateSeriesWithManuscript([FromForm] CreateSeriesWithManuscriptDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var mangakaId = GetCurrentUserId();
            var series = await _seriesService.CreateSeries(mangakaId, new CreateSeriesDto
            {
                Title = dto.Title,
                TitleJp = dto.TitleJp,
                Synopsis = dto.Synopsis,
                Genres = dto.Genres
            });

            if (dto.PreliminaryPages.Count > 0)
            {
                var chapter = await _chapterService.CreateChapter(series.SeriesId, mangakaId, new CreateChapterDto
                {
                    ChapterNumber = 1,
                    Title = string.IsNullOrWhiteSpace(dto.ChapterTitle) ? "Chapter 001" : dto.ChapterTitle
                });

                var normalizedFiles = new List<IFormFile>();
                for (var index = 0; index < dto.PreliminaryPages.Count; index++)
                {
                    var file = dto.PreliminaryPages[index];
                    var ext = Path.GetExtension(file.FileName);
                    var normalizedFile = new FormFile(file.OpenReadStream(), 0, file.Length, file.Name, $"page_{index + 1:D3}{ext}")
                    {
                        Headers = file.Headers,
                        ContentType = file.ContentType
                    };
                    normalizedFiles.Add(normalizedFile);
                }

                await _chapterService.UploadPages(chapter.ChapterId, normalizedFiles, mangakaId);
            }

            var result = await _seriesService.GetSeriesById(series.SeriesId, mangakaId);
            return StatusCode(201, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/series/{id} — Cập nhật thông tin bộ truyện.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> UpdateSeries(Guid id, [FromBody] UpdateSeriesDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var mangakaId = GetCurrentUserId();
            var result = await _seriesService.UpdateSeries(id, mangakaId, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/series/{id}/editorial-decision - Editorial Board huy, dua vao theo doi, hoac kich hoat lai series.
    /// </summary>
    [HttpPut("{id:guid}/editorial-decision")]
    [Authorize(Roles = "editorial")]
    public async Task<IActionResult> ApplyEditorialDecision(Guid id, [FromBody] EditorialSeriesDecisionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var editorialId = GetCurrentUserId();
            var result = await _seriesService.ApplyEditorialDecision(id, editorialId, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/series/{id}/resubmit - Mangaka gui lai de xuat sau khi bi tu choi.
    /// </summary>
    [HttpPost("{id:guid}/resubmit")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> ResubmitSeries(Guid id)
    {
        try
        {
            var mangakaId = GetCurrentUserId();
            var result = await _seriesService.ResubmitSeries(id, mangakaId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/series/{id}/chapters — Lấy danh sách chương của bộ truyện.
    /// </summary>
    [HttpGet("{id:guid}/chapters")]
    public async Task<IActionResult> GetChapters(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _seriesService.GetChaptersBySeries(id, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/series/{id}/chapters — Tạo chương mới trong bộ truyện.
    /// </summary>
    [HttpPost("{id:guid}/chapters")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> CreateChapter(Guid id, [FromBody] CreateChapterDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var mangakaId = GetCurrentUserId();
            var result = await _chapterService.CreateChapter(id, mangakaId, dto);
            return StatusCode(201, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/series/{id}/upload-cover — Tải lên ảnh bìa cho bộ truyện.
    /// </summary>
    [HttpPost("{id:guid}/upload-cover")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> UploadCover(Guid id, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("File không hợp lệ hoặc trống.");
        }

        try
        {
            var mangakaId = GetCurrentUserId();
            
            // Tải file lên Cloudinary
            string coverUrl = await _storageService.UploadFileAsync(file, "MangaStudio/Covers");

            // Cập nhật CoverImageUrl thông qua service
            var dto = new UpdateSeriesDto { CoverImageUrl = coverUrl };
            var result = await _seriesService.UpdateSeries(id, mangakaId, dto);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/series/ranking — Lấy bảng xếp hạng bộ truyện.
    /// </summary>
    [HttpGet("ranking")]
    public async Task<IActionResult> GetSeriesRanking([FromQuery] string? genre, [FromQuery] string? sortBy, [FromQuery] string? timeframe)
    {
        try
        {
            var result = await _seriesService.GetSeriesRanking(genre, sortBy, timeframe);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
