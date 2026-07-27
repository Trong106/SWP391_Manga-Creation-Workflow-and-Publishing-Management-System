using MangaStudio.Backend.Models.DTOs;
using MangaStudio.Backend.Models.Entities;
using MangaStudio.Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MangaStudio.Backend.Controllers;




[ApiController]
[Route("api/pages")]
[Authorize]
public class PageController : ControllerBase
{
    private readonly IPageService _pageService;

    public PageController(IPageService pageService)
    {
        _pageService = pageService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Guid.Empty;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    
    
    
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPageById(Guid id)
    {
        try
        {
            var result = await _pageService.GetPageById(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpGet("{id:guid}/annotations")]
    public async Task<IActionResult> GetAnnotations(Guid id)
    {
        try
        {
            var result = await _pageService.GetAnnotations(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpPost("{id:guid}/annotations")]
    public async Task<IActionResult> CreateAnnotation(Guid id, [FromBody] CreateAnnotationDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var userId = GetCurrentUserId();
            var result = await _pageService.CreateAnnotation(id, userId, dto);
            return StatusCode(201, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpPut("annotations/{id:guid}/resolve")]
    public async Task<IActionResult> ResolveAnnotation(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _pageService.ResolveAnnotation(id, userId);
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

    [HttpDelete("annotations/{id:guid}")]
    [Authorize(Roles = "tantou")]
    public async Task<IActionResult> DeleteAnnotation(Guid id)
    {
        try
        {
            await _pageService.DeleteAnnotation(id, GetCurrentUserId());
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpGet("{id:guid}/reviews")]
    public async Task<IActionResult> GetPageReviews(Guid id)
    {
        try
        {
            var result = await _pageService.GetPageReviews(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}/versions")]
    public async Task<IActionResult> GetPageVersions(Guid id)
    {
        try
        {
            var result = await _pageService.GetPageVersions(id);
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

    
    
    
    [HttpPost("{id:guid}/reviews")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> CreatePageReview(Guid id, [FromBody] CreatePageReviewDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var reviewerId = GetCurrentUserId();
            var result = await _pageService.CreatePageReview(id, reviewerId, dto);
            return StatusCode(201, result);
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

    
    
    
    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> CreatePageComment(Guid id, [FromBody] CreateCommentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var userId = GetCurrentUserId();
            var result = await _pageService.CreatePageComment(id, userId, dto);
            return StatusCode(201, result);
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
}
