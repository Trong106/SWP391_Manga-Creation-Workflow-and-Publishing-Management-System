using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MangaStudio.Backend.Models.DTOs;
using MangaStudio.Backend.Services.Interfaces;

namespace MangaStudio.Backend.Controllers;

/// <summary>
/// Controller điều hướng các yêu cầu liên quan đến tài khoản và xác thực (Authentication).
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    // Dependency Injection: Nhận đối tượng xử lý nghiệp vụ xác thực (IAuthService)
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// API xử lý đăng nhập hệ thống và cấp phát JWT Token.
    /// </summary>
    /// <param name="loginDto">DTO chứa email và mật khẩu của người dùng.</param>
    /// <returns>HTTP 200 kèm theo Token và thông tin người dùng nếu đăng nhập đúng; HTTP 401 nếu sai thông tin.</returns>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto loginDto)
    {
        // Kiểm tra dữ liệu đầu vào xem có vi phạm các ràng buộc (Validation Attributes) không
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Gọi service xử lý nghiệp vụ kiểm tra đăng nhập
        var result = await _authService.LoginAsync(loginDto);

        // Nếu thông tin không khớp hoặc không hợp lệ, trả về lỗi Unauthorized (401)
        if (result == null)
        {
            return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác, hoặc tài khoản đã bị khóa." });
        }

        // Trả về kết quả đăng nhập thành công
        return Ok(result);
    }
}
