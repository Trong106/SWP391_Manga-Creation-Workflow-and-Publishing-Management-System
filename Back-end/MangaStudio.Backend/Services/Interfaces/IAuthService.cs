using System.Threading.Tasks;
using MangaStudio.Backend.Models.DTOs;

namespace MangaStudio.Backend.Services.Interfaces;

/// <summary>
/// Giao diện xử lý nghiệp vụ liên quan đến xác thực và phân quyền (Authentication).
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Thực hiện đăng nhập, xác thực người dùng dựa trên email và mật khẩu, trả về thông tin đăng nhập kèm JWT Token.
    /// </summary>
    /// <param name="loginDto">DTO chứa thông tin email và mật khẩu đăng nhập.</param>
    /// <returns>Thông tin đăng nhập thành công kèm JWT Token, hoặc trả về null nếu thất bại.</returns>
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginDto);
}
