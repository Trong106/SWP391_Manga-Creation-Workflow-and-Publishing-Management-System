using System.ComponentModel.DataAnnotations;

namespace MangaStudio.Backend.Models.DTOs;

/// <summary>
/// Data Transfer Object (DTO) chứa thông tin gửi lên từ client để thực hiện đăng nhập.
/// </summary>
public class LoginRequestDto
{
    /// <summary>
    /// Email đăng nhập của người dùng.
    /// </summary>
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = null!;

    /// <summary>
    /// Mật khẩu đăng nhập.
    /// </summary>
    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = null!;
}
