using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MangaStudio.Backend.Services.Interfaces;
using System.Security.Claims;

namespace MangaStudio.Backend.Controllers;




[ApiController]
[Route("api/mangaka")] 
[Authorize] 
public class MangakaController : ControllerBase 
{ 
    private readonly IMangakaService _mangakaService; 

    
    public MangakaController(IMangakaService mangakaService)
    { 
        _mangakaService = mangakaService; 
    }

    
    
    
    
    
    [HttpGet("dashboard-stats/{mangakaId}")]
    public async Task<IActionResult> GetDashboardStats(Guid mangakaId)
    {
        var result = await _mangakaService.GetDashboardStats(mangakaId);
        return Ok(result);
    }

    
    
    
    
    
    [HttpGet("series")]
    public async Task<IActionResult> GetSeries(Guid mangakaId)
    { 
        var result = await _mangakaService.GetSeries(mangakaId);
        return Ok(result);
    }

    
    
    
    
    
    
    [HttpPost("chapters/{id}/upload-pages")]
    public async Task<IActionResult> UploadPage(Guid id, IFormFile file, [FromQuery] int? pageNumber = null)
    { 
        if (file == null || file.Length == 0)
        {
            return BadRequest("File không hợp lệ hoặc trống.");
        }

        
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Không xác định được người dùng đăng nhập.");
        }

        var result = await _mangakaService.UploadPage(id, file, userId, pageNumber);
        return Ok(result);
    }
}
