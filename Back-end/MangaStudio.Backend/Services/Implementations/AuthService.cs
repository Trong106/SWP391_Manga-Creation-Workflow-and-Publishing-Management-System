using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using MangaStudio.Backend.Data;
using MangaStudio.Backend.Models.DTOs;
using MangaStudio.Backend.Models.Entities;
using MangaStudio.Backend.Services.Interfaces;

namespace MangaStudio.Backend.Services.Implementations;

/// <summary>
/// Lớp triển khai các dịch vụ xác thực người dùng, băm mật khẩu và cấp phát JWT Token.
/// </summary>
public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _passwordHasher;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<User>();
    }

    /// <summary>
    /// Thực hiện xác thực người dùng. Nếu thông tin đúng, sinh JWT Token cho phiên đăng nhập.
    /// </summary>
    /// <param name="loginDto">Thông tin email và mật khẩu của client gửi lên.</param>
    /// <returns>Đối tượng LoginResponseDto chứa Token và thông tin cơ bản, hoặc null nếu xác thực thất bại.</returns>
    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginDto)
    {
        // 1. Tìm người dùng trong database bằng Email (bao gồm cả thông tin vai trò Role)
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == loginDto.Email.ToLower());

        // Nếu không tìm thấy người dùng hoặc tài khoản đang bị vô hiệu hóa
        if (user == null || !user.IsActive)
        {
            return null;
        }

        // 2. Xác thực mật khẩu
        // Vì trong database mẫu (seeding), cột PasswordHash đang là NULL
        // Ta sẽ tự động gán mật khẩu mặc định là "123456" cho các tài khoản này ở lần đăng nhập đầu tiên.
        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            // Nếu người dùng nhập đúng mật khẩu mặc định dùng thử
            if (loginDto.Password == "123456")
            {
                // Băm mật khẩu và cập nhật vào database để những lần sau xác thực an toàn
                user.PasswordHash = _passwordHasher.HashPassword(user, loginDto.Password);
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            else
            {
                // Nếu nhập sai mật khẩu mặc định
                return null;
            }
        }
        else
        {
            // Xác thực mật khẩu đã băm (PasswordHash) trong cơ sở dữ liệu
            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, loginDto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                return null;
            }
        }

        // 3. Sinh JWT Token nếu xác thực thành công
        var token = GenerateJwtToken(user);

        // 4. Trả về thông tin đăng nhập hoàn chỉnh
        return new LoginResponseDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.Code, // Lấy mã Code của vai trò (ví dụ: mangaka, assistant)
            Token = token
        };
    }

    /// <summary>
    /// Phương thức hỗ trợ tạo JWT Token từ thông tin người dùng.
    /// </summary>
    /// <param name="user">Người dùng đã đăng nhập thành công.</param>
    /// <returns>Chuỗi JWT Token mã hóa.</returns>
    private string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        
        // Đọc cấu hình khóa bí mật từ file appsettings.json
        var secretKey = _configuration["Jwt:Key"] ?? "MangaStudioWorkflowSuperSecretKey12345!";
        var key = Encoding.UTF8.GetBytes(secretKey);

        // Cài đặt các Claim chứa thông tin cần thiết của Token
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.Code) // Sử dụng vai trò để phân quyền phân hệ
        };

        // Đọc cấu hình thời gian hết hạn và các thông tin định danh Issuer, Audience
        var expiryInMinutes = double.Parse(_configuration["Jwt:ExpiryInMinutes"] ?? "180");
        var issuer = _configuration["Jwt:Issuer"] ?? "MangaStudio.Backend";
        var audience = _configuration["Jwt:Audience"] ?? "MangaStudio.Frontend";

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryInMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        // Tạo cấu trúc Token và chuyển hóa thành dạng chuỗi Base64Url
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
