using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using MangaStudio.Backend.Services.Interfaces;

namespace MangaStudio.Backend.Services.Implementations;

/// <summary>
/// Lớp triển khai của IStorageService kết nối và upload file lên Cloudinary.
/// </summary>
public class CloudinaryService : IStorageService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"];
        var apiKey = configuration["Cloudinary:ApiKey"];
        var apiSecret = configuration["Cloudinary:ApiSecret"];

        if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            throw new ArgumentException("Thiếu cấu hình tài khoản Cloudinary trong file appsettings.json.");
        }

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true; // Sử dụng giao thức HTTPS
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folderName)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Tệp tin tải lên không hợp lệ hoặc trống.");
        }

        var ext = Path.GetExtension(file.FileName).ToLower();
        var allowedImageExtensions = new[] { ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp", ".psd" };

        using var stream = file.OpenReadStream();
        
        // Phân biệt luồng upload: nếu là các định dạng ảnh thông thường (bao gồm cả .psd)
        if (allowedImageExtensions.Contains(ext))
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = folderName
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.Error != null)
            {
                throw new Exception($"Lỗi upload ảnh lên Cloudinary: {uploadResult.Error.Message}");
            }

            return uploadResult.SecureUrl.ToString();
        }
        else // Đối với các định dạng tệp thô khác (như .clip của Clip Studio Paint)
        {
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = folderName
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.Error != null)
            {
                throw new Exception($"Lỗi upload tệp thô lên Cloudinary: {uploadResult.Error.Message}");
            }

            return uploadResult.SecureUrl.ToString();
        }
    }
}
