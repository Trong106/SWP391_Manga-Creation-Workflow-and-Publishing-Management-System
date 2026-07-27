using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using MangaStudio.Backend.Services.Interfaces;
using MangaStudio.Backend.Models.DTOs;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MangaStudio.Backend.Controllers;




[ApiController]
[Route("api")]
[Authorize]
public class TaskController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TaskController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Guid.Empty;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    
    
    
    [HttpGet("assistants")]
    public async Task<IActionResult> GetAllAssistants()
    {
        try
        {
            var result = await _taskService.GetAllAssistants();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpGet("pages/{pageId:guid}/tasks")]
    public async Task<IActionResult> GetTasksByPage(Guid pageId)
    {
        try
        {
            var result = await _taskService.GetTasksByPage(pageId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpPost("pages/{pageId:guid}/tasks")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> CreateTask(Guid pageId, [FromBody] CreateTaskDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var assignerId = GetCurrentUserId();
            var result = await _taskService.CreateTask(pageId, assignerId, dto);
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
        catch (InvalidOperationException ex)
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

    
    
    
    [HttpGet("tasks/my-tasks")]
    [Authorize(Roles = "assistant")]
    public async Task<IActionResult> GetMyTasks()
    {
        try
        {
            var assistantId = GetCurrentUserId();
            var result = await _taskService.GetMyTasks(assistantId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpGet("tasks/{id:guid}/resources")]
    [Authorize(Roles = "assistant,mangaka")]
    public async Task<IActionResult> GetTaskResource(Guid id)
    {
        try
        {
            var result = await _taskService.GetTaskResource(id);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy tài nguyên cho công việc này." });
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpPost("tasks/{id:guid}/start")]
    [Authorize(Roles = "assistant")]
    public async Task<IActionResult> StartTask(Guid id)
    {
        try
        {
            var assistantId = GetCurrentUserId();
            var result = await _taskService.StartTask(id, assistantId);
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("tasks/{id:guid}/ask")]
    [Authorize(Roles = "assistant")]
    public async Task<IActionResult> AskClarification(Guid id, [FromBody] AskClarificationDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var assistantId = GetCurrentUserId();
            var result = await _taskService.AskClarification(id, assistantId, dto);
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

    
    
    
    [HttpPut("tasks/{id:guid}")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var mangakaId = GetCurrentUserId();
            var result = await _taskService.UpdateTask(id, mangakaId, dto);
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
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

    [HttpPost("tasks/{id:guid}/re-task")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> ReTask(Guid id, [FromBody] ReTaskDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var mangakaId = GetCurrentUserId();
            var result = await _taskService.ReTask(id, mangakaId, dto);
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
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

    
    
    
    [HttpPost("tasks/{id:guid}/submit")]
    [Authorize(Roles = "assistant")]
    public async Task<IActionResult> SubmitTask(Guid id, [FromForm] string? note, IFormFile? file)
    {
        try
        {
            var assistantId = GetCurrentUserId();
            var result = await _taskService.SubmitTask(id, assistantId, note, file);
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
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpGet("tasks/{id:guid}/submissions")]
    public async Task<IActionResult> GetSubmissions(Guid id)
    {
        try
        {
            var result = await _taskService.GetSubmissions(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
    
    
    [HttpPut("submissions/{id:guid}/review")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> ReviewSubmission(Guid id, [FromBody] ReviewSubmissionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var reviewerId = GetCurrentUserId();
            var result = await _taskService.ReviewSubmission(id, reviewerId, dto);
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
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
}
