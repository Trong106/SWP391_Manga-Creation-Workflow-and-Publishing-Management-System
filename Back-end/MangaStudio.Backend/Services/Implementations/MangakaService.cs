using Microsoft.EntityFrameworkCore;
using MangaStudio.Backend.Data;
using MangaStudio.Backend.Models.DTOs;
using MangaStudio.Backend.Models.Entities;
using MangaStudio.Backend.Services.Interfaces;

namespace MangaStudio.Backend.Services.Implementations;

/// <summary>
/// Dịch vụ triển khai các nghiệp vụ liên quan đến vai trò Mangaka (Tác giả).
/// </summary>
public class MangakaService : IMangakaService
{
    private readonly AppDbContext _context;
    private readonly IStorageService _storageService;

    // Dependency Injection: Nhận database context của ứng dụng và storage service
    public MangakaService(AppDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    /// <summary>
    /// Lấy thống kê dữ liệu trang Dashboard bao gồm: Tổng số Series và tổng số trợ lý.
    /// </summary>
    /// <param name="mangakaId">ID định danh Mangaka.</param>
    /// <returns>DashboardStatsDto chứa tổng số Series và số trợ lý.</returns>
    public async Task<DashboardStatsDto> GetDashboardStats(Guid mangakaId)
    {
        // Đếm số lượng bộ truyện (Series) thuộc quyền sở hữu của Mangaka này
        int totalSeries = await _context.Series
            .CountAsync(x => x.MangakaId == mangakaId);

        // Đếm số trợ lý phân biệt đã nhận task từ Mangaka này
        int totalAssistants = await _context.Tasks
            .Where(t => t.AssignerId == mangakaId && t.AssigneeId != null)
            .Select(t => t.AssigneeId!.Value)
            .Distinct()
            .CountAsync();

        return new DashboardStatsDto
        {
            TotalSeries = totalSeries,
            TotalAssistants = totalAssistants
        };
    }

    /// <summary>
    /// Lấy danh sách các bộ truyện (Series) do Mangaka này sáng tác.
    /// </summary>
    /// <param name="mangakaId">ID định danh Mangaka.</param>
    /// <returns>Danh sách bộ truyện dạng MangaSeriesDto.</returns>
    public async Task<List<MangaSeriesDto>> GetSeries(Guid mangakaId)
    {
        return await _context.Series
            .Where(x => x.MangakaId == mangakaId)
            .Select(x => new MangaSeriesDto
            {
                Id = x.SeriesId,
                Title = x.Title,
                Description = x.Synopsis, // Synopsis ánh xạ thành Description của DTO
                CoverImageUrl = x.CoverImageUrl
            })
            .ToListAsync();
    }

    /// <summary>
    /// Tải hình vẽ trang truyện lên server và lưu thông tin vào database.
    /// </summary>
    /// <param name="chapterId">ID Chapter truyện chứa trang vẽ này.</param>
    /// <param name="file">Tệp ảnh vẽ tải lên từ máy khách.</param>
    /// <returns>Đường dẫn URL của trang vẽ đã upload.</returns>
    public async Task<string> UploadPage(Guid chapterId, IFormFile file, Guid uploadedById, int? pageNumber = null)
    {
        // 1. Tải hình vẽ trang truyện lên Cloudinary
        string imageUrl = await _storageService.UploadFileAsync(file, "MangaStudio/Pages");

        MangaPage? mangaPage = null;

        if (pageNumber.HasValue)
        {
            // Kiểm tra xem trang với số trang đó đã tồn tại trong chapter chưa
            mangaPage = await _context.MangaPages
                .Include(p => p.PageAnnotations)
                .FirstOrDefaultAsync(p => p.ChapterId == chapterId && p.PageNumber == pageNumber.Value);
        }

        if (mangaPage != null)
        {
            // Nếu đã tồn tại, cập nhật CurrentImageUrl và thông tin liên quan
            mangaPage.CurrentImageUrl = imageUrl;
            mangaPage.UploadedAt = DateTime.UtcNow;
            mangaPage.UploadedById = uploadedById;
            mangaPage.Status = "pending"; // Đặt về pending để review lại bản thảo mới

            // Lấy VersionNumber lớn nhất hiện tại của trang này và tạo một PageVersion mới
            var maxVer = await _context.PageVersions
                .Where(v => v.PageId == mangaPage.PageId)
                .Select(v => (int?)v.VersionNumber)
                .MaxAsync() ?? 0;

            var version = new PageVersion
            {
                PageVersionId = Guid.NewGuid(),
                PageId = mangaPage.PageId,
                VersionNumber = maxVer + 1,
                FileUrl = imageUrl,
                FileName = file.FileName,
                FileSizeBytes = file.Length,
                MimeType = file.ContentType,
                UploadedById = uploadedById,
                CreatedAt = DateTime.UtcNow,
                Note = $"Cập nhật lại bản vẽ trang số {mangaPage.PageNumber}"
            };

            _context.PageVersions.Add(version);

            foreach (var annotation in mangaPage.PageAnnotations.Where(a => a.Status == "open"))
            {
                annotation.Status = "resolved";
                annotation.ResolvedAt = DateTime.UtcNow;
            }
        }
        else
        {
            // Nếu chưa tồn tại (hoặc không truyền pageNumber), tạo trang mới
            int targetPageNumber;
            if (pageNumber.HasValue)
            {
                targetPageNumber = pageNumber.Value;
            }
            else
            {
                // Tự động tìm số trang tiếp theo
                int maxPageNumber = await _context.MangaPages
                    .Where(p => p.ChapterId == chapterId)
                    .Select(p => (int?)p.PageNumber)
                    .MaxAsync() ?? 0;
                targetPageNumber = maxPageNumber + 1;
            }

            mangaPage = new MangaPage
            {
                PageId = Guid.NewGuid(),
                ChapterId = chapterId,
                CurrentImageUrl = imageUrl,
                UploadedAt = DateTime.UtcNow,
                Status = "pending",
                PageNumber = targetPageNumber,
                UploadedById = uploadedById
            };

            var version = new PageVersion
            {
                PageVersionId = Guid.NewGuid(),
                PageId = mangaPage.PageId,
                VersionNumber = 1,
                FileUrl = imageUrl,
                FileName = file.FileName,
                FileSizeBytes = file.Length,
                MimeType = file.ContentType,
                UploadedById = uploadedById,
                CreatedAt = DateTime.UtcNow,
                Note = $"Tải lên trang ban đầu (Trang số {targetPageNumber})"
            };

            _context.MangaPages.Add(mangaPage);
            _context.PageVersions.Add(version);
        }

        await _context.SaveChangesAsync();

        return mangaPage.CurrentImageUrl;
    }
}
