using System;

namespace MangaStudio.Backend.Models.DTOs;




public class LoginResponseDto
{
    
    
    
    public Guid UserId { get; set; }

    
    
    
    public string FullName { get; set; } = null!;

    
    
    
    public string Email { get; set; } = null!;

    
    
    
    public string Role { get; set; } = null!;

    
    
    
    public string Token { get; set; } = null!;
}
