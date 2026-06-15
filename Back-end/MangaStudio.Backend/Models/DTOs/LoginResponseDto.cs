using System;

namespace MangaStudio.Backend.Models.DTOs;

/// <summary>
/// Data Transfer Object (DTO) trả về thông tin người dùng và mã JWT token sau khi đăng nhập thành công.
/// </summary>
public class LoginResponseDto
{
    /// <summary>
    /// ID định danh duy nhất của người dùng.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Họ và tên đầy đủ của người dùng.
    /// </summary>
    public string FullName { get; set; } = null!;

    /// <summary>
    /// Địa chỉ email của người dùng.
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Mã vai trò (ví dụ: mangaka, assistant, tantou, editorial).
    /// </summary>
    public string Role { get; set; } = null!;

    /// <summary>
    /// Chuỗi mã JWT Token dùng để xác thực các request tiếp theo từ phía Client.
    /// </summary>
    public string Token { get; set; } = null!;
}
