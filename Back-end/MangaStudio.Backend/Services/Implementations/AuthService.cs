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

    
    
    
    
    
    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginDto)
    {
        
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == loginDto.Email.ToLower());

        
        if (user == null || !user.IsActive)
        {
            return null;
        }

        
        
        
        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            
            if (loginDto.Password == "123456")
            {
                
                user.PasswordHash = _passwordHasher.HashPassword(user, loginDto.Password);
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            else
            {
                
                return null;
            }
        }
        else
        {
            
            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, loginDto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                return null;
            }
        }

        
        var token = GenerateJwtToken(user);

        
        return new LoginResponseDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.Code, 
            Token = token
        };
    }

    
    
    
    
    
    private string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        
        
        var secretKey = _configuration["Jwt:Key"] ?? "MangaStudioWorkflowSuperSecretKey12345!";
        var key = Encoding.UTF8.GetBytes(secretKey);

        
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.Code) 
        };

        
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

        
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
