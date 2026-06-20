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
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
    public string Email { get; set; } = null!;

    /// <summary>
    /// Mật khẩu đăng nhập.
    /// </summary>
    [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
    public string Password { get; set; } = null!;
}
