using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace MangaStudio.Backend.Services.Interfaces;




public interface IStorageService
{
    
    
    
    
    
    
    Task<string> UploadFileAsync(IFormFile file, string folderName);
}
