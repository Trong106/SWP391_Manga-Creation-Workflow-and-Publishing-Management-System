using System.Threading.Tasks;
using MangaStudio.Backend.Models.DTOs;

namespace MangaStudio.Backend.Services.Interfaces;




public interface IAuthService
{
    
    
    
    
    
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginDto);
}
