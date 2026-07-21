using MangaStudio.Backend.Models.DTOs;

namespace MangaStudio.Backend.Services.Interfaces;

/// <summary>Interface dịch vụ quản lý bộ truyện (Series).</summary>
public interface ISeriesService
{
    /// <summary>Lấy danh sách bộ truyện của Mangaka.</summary>
    Task<List<SeriesDto>> GetSeriesByMangaka(Guid mangakaId);

    /// <summary>Lấy catalog series cho mọi role đã đăng nhập.</summary>
    Task<List<SeriesDto>> GetSeriesCatalog(Guid requestUserId, bool isMangaka, bool isEditorial);

    /// <summary>Lấy chi tiết một bộ truyện.</summary>
    Task<SeriesDto> GetSeriesById(Guid seriesId, Guid requestUserId);

    /// <summary>Tạo bộ truyện mới.</summary>
    Task<SeriesDto> CreateSeries(Guid mangakaId, CreateSeriesDto dto);

    /// <summary>Cập nhật thông tin bộ truyện.</summary>
    Task<SeriesDto> UpdateSeries(Guid seriesId, Guid mangakaId, UpdateSeriesDto dto);

    Task<SeriesDto> ApplyEditorialDecision(Guid seriesId, Guid editorialId, EditorialSeriesDecisionDto dto);

    Task<SeriesDto> ResubmitSeries(Guid seriesId, Guid mangakaId);

    /// <summary>Lấy danh sách chương của bộ truyện.</summary>
    Task<List<ChapterDto>> GetChaptersBySeries(Guid seriesId, Guid requestUserId);

    /// <summary>Lấy bảng xếp hạng bộ truyện.</summary>
    Task<SeriesRankingContainerDto> GetSeriesRanking(string? genre, string? sortBy, string? timeframe);
}
