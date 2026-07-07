using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MangaStudio.Backend.Services.Interfaces;
using MangaStudio.Backend.Models.DTOs;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MangaStudio.Backend.Controllers;

/// <summary>
/// Controller quản lý đề xuất series, lịch xuất bản và bảng lương.
/// </summary>
[ApiController]
[Route("api")]
[Authorize]
public class WorkflowController : ControllerBase
{
    private readonly IWorkflowService _workflowService;

    public WorkflowController(IWorkflowService workflowService)
    {
        _workflowService = workflowService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Guid.Empty;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    // === Series Proposals ===

    /// <summary>
    /// GET /api/proposals — Tantou xem danh sách đề xuất chờ duyệt.
    /// </summary>
    [HttpGet("proposals")]
    [Authorize(Roles = "tantou,editorial")]
    public async Task<IActionResult> GetPendingProposals()
    {
        try
        {
            var result = await _workflowService.GetPendingProposals();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/proposals/my-proposals — Mangaka xem danh sách đề xuất của mình.
    /// </summary>
    [HttpGet("proposals/my-proposals")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> GetMyProposals()
    {
        try
        {
            var mangakaId = GetCurrentUserId();
            var result = await _workflowService.GetProposalsByMangaka(mangakaId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/proposals/{id}/review — Tantou phê duyệt hoặc từ chối đề xuất series.
    /// </summary>
    [HttpPut("proposals/{id:guid}/review")]
    [Authorize(Roles = "editorial")]
    public async Task<IActionResult> ReviewProposal(Guid id, [FromBody] ReviewProposalDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var editorialId = GetCurrentUserId();
            var result = await _workflowService.ReviewProposal(id, editorialId, dto);
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

    [HttpGet("users/by-role/{roleCode}")]
    [Authorize(Roles = "editorial")]
    public async Task<IActionResult> GetUsersByRole(string roleCode)
    {
        try
        {
            var result = await _workflowService.GetUsersByRole(roleCode);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // === Publish Schedule ===

    /// <summary>
    /// GET /api/publish-schedules — Lấy danh sách lịch xuất bản (có thể lọc theo seriesId).
    /// </summary>
    [HttpGet("publish-schedules")]
    public async Task<IActionResult> GetPublishSchedules([FromQuery] Guid? seriesId)
    {
        try
        {
            var result = await _workflowService.GetPublishSchedules(seriesId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/chapters/{id}/schedule — Tạo lịch xuất bản cho một chương truyện.
    /// </summary>
    [HttpPost("chapters/{id:guid}/schedule")]
    [Authorize(Roles = "editorial")]
    public async Task<IActionResult> CreatePublishSchedule(Guid id, [FromBody] CreatePublishScheduleDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var createdById = GetCurrentUserId();
            var result = await _workflowService.CreatePublishSchedule(id, createdById, dto);
            return StatusCode(201, result);
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
    /// PUT /api/publish-schedules/{id}/approve — Tantou phê duyệt lịch xuất bản.
    /// </summary>
    [HttpPut("publish-schedules/{id:guid}/approve")]
    [Authorize(Roles = "editorial")]
    public async Task<IActionResult> ApprovePublishSchedule(Guid id)
    {
        try
        {
            var editorialId = GetCurrentUserId();
            var result = await _workflowService.ApprovePublishSchedule(id, editorialId);
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

    // === Payroll ===

    /// <summary>
    /// GET /api/payroll — Mangaka xem toàn bộ bảng lương trợ lý.
    /// </summary>
    [HttpGet("payroll")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> GetPayrollRecords()
    {
        try
        {
            var mangakaId = GetCurrentUserId();
            var result = await _workflowService.GetPayrollRecords(mangakaId: mangakaId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/payroll/my-payroll — Trợ lý xem bảng lương của mình.
    /// </summary>
    [HttpGet("payroll/my-payroll")]
    [Authorize(Roles = "assistant")]
    public async Task<IActionResult> GetMyPayroll()
    {
        try
        {
            var assistantId = GetCurrentUserId();
            var result = await _workflowService.GetPayrollRecords(assistantId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("payroll/my-payroll/monthly")]
    [Authorize(Roles = "assistant")]
    public async Task<IActionResult> GetMyPayrollMonthly()
    {
        try
        {
            var assistantId = GetCurrentUserId();
            var result = await _workflowService.GetAssistantPayrollMonths(assistantId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/payroll/{id}/pay — Mangaka đánh dấu đã thanh toán lương cho trợ lý.
    /// </summary>
    [HttpPut("payroll/{id:guid}/pay")]
    [Authorize(Roles = "mangaka")]
    public async Task<IActionResult> MarkPayrollAsPaid(Guid id)
    {
        try
        {
            var mangakaId = GetCurrentUserId();
            var result = await _workflowService.MarkPayrollAsPaid(id, mangakaId);
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

    // === Notifications ===

    /// <summary>
    /// GET /api/notifications — Lấy danh sách thông báo của người dùng đang đăng nhập.
    /// </summary>
    [HttpGet("notifications")]
    public async Task<IActionResult> GetMyNotifications()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _workflowService.GetNotifications(userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/notifications/{id}/read — Đánh dấu một thông báo đã đọc.
    /// </summary>
    [HttpPut("notifications/{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _workflowService.MarkAsRead(id, userId);
            if (!success) return NotFound(new { message = "Không tìm thấy thông báo hoặc bạn không có quyền." });
            return Ok(new { message = "Đã đánh dấu đã đọc." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/notifications/read-all — Đánh dấu tất cả thông báo của người dùng đã đọc.
    /// </summary>
    [HttpPut("notifications/read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        try
        {
            var userId = GetCurrentUserId();
            await _workflowService.MarkAllAsRead(userId);
            return Ok(new { message = "Đã đánh dấu đọc tất cả thông báo." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
