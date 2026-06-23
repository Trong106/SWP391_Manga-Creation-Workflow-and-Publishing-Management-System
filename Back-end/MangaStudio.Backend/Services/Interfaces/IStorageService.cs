using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace MangaStudio.Backend.Services.Interfaces;

/// <summary>
/// Dịch vụ quản lý lưu trữ tệp tin.
/// </summary>
public interface IStorageService
{
    /// <summary>
    /// Tải lên một tệp tin và trả về URL tuyệt đối của tệp đã lưu trữ.
    /// </summary>
    /// <param name="file">Tệp tin cần tải lên.</param>
    /// <param name="folderName">Tên thư mục lưu trữ trên hệ thống đám mây.</param>
    /// <returns>Đường dẫn URL tuyệt đối truy cập tệp.</returns>
    Task<string> UploadFileAsync(IFormFile file, string folderName);
}
