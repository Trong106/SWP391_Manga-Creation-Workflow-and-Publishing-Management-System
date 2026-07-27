using Microsoft.EntityFrameworkCore;
using MangaStudio.Backend.Data;
using MangaStudio.Backend.Models.DTOs;
using MangaStudio.Backend.Models.Entities;
using MangaStudio.Backend.Services.Interfaces;

namespace MangaStudio.Backend.Services.Implementations;




public class MangakaService : IMangakaService
{
    private readonly AppDbContext _context;
    private readonly IStorageService _storageService;

    
    public MangakaService(AppDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    
    
    
    
    
    public async Task<DashboardStatsDto> GetDashboardStats(Guid mangakaId)
    {
        
        int totalSeries = await _context.Series
            .CountAsync(x => x.MangakaId == mangakaId);

        
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

    
    
    
    
    
    public async Task<List<MangaSeriesDto>> GetSeries(Guid mangakaId)
    {
        return await _context.Series
            .Where(x => x.MangakaId == mangakaId && x.Status != "proposal")
            .Select(x => new MangaSeriesDto
            {
                Id = x.SeriesId,
                Title = x.Title,
                Description = x.Synopsis, 
                CoverImageUrl = x.CoverImageUrl,
                Status = x.Status
            })
            .ToListAsync();
    }

    
    
    
    
    
    
    public async Task<string> UploadPage(Guid chapterId, IFormFile file, Guid uploadedById, int? pageNumber = null)
    {
        var chapter = await _context.Chapters
            .Include(c => c.Series)
            .FirstOrDefaultAsync(c => c.ChapterId == chapterId)
            ?? throw new KeyNotFoundException($"Chapter với ID {chapterId} không tồn tại.");
        if (chapter.Series.Status == "cancelled")
        {
            throw new InvalidOperationException("Cannot upload pages for a cancelled series.");
        }

        
        string imageUrl = await _storageService.UploadFileAsync(file, "MangaStudio/Pages");

        MangaPage? mangaPage = null;

        if (pageNumber.HasValue)
        {
            
            mangaPage = await _context.MangaPages
                .FirstOrDefaultAsync(p => p.ChapterId == chapterId && p.PageNumber == pageNumber.Value);
        }

        if (mangaPage != null)
        {
            
            mangaPage.CurrentImageUrl = imageUrl;
            mangaPage.UploadedAt = DateTime.UtcNow;
            mangaPage.UploadedById = uploadedById;
            mangaPage.Status = "pending"; 

            
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
        }
        else
        {
            
            int targetPageNumber;
            if (pageNumber.HasValue)
            {
                targetPageNumber = pageNumber.Value;
            }
            else
            {
                
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
