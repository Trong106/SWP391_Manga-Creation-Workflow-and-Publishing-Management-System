using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MangaStudio.Backend.Models.DTOs;
using MangaStudio.Backend.Services.Interfaces;

namespace MangaStudio.Backend.Controllers;




[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    
    
    
    
    
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto loginDto)
    {
        
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        
        var result = await _authService.LoginAsync(loginDto);

        
        if (result == null)
        {
            return Unauthorized(new { message = "Incorrect email or password, or the account is locked." });
        }

        
        return Ok(result);
    }
}
