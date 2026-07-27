using MangaStudio.Backend.Models.DTOs;

namespace MangaStudio.Backend.Services.Interfaces;


public interface ISeriesService
{
    
    Task<List<SeriesDto>> GetSeriesByMangaka(Guid mangakaId);

    
    Task<List<SeriesDto>> GetSeriesCatalog(Guid requestUserId, bool isMangaka, bool isEditorial);

    
    Task<SeriesDto> GetSeriesById(Guid seriesId, Guid requestUserId);

    
    Task<SeriesDto> CreateSeries(Guid mangakaId, CreateSeriesDto dto);

    
    Task<SeriesDto> UpdateSeries(Guid seriesId, Guid mangakaId, UpdateSeriesDto dto);

    Task<SeriesDto> ApplyEditorialDecision(Guid seriesId, Guid editorialId, EditorialSeriesDecisionDto dto);

    Task<SeriesDto> ResubmitSeries(Guid seriesId, Guid mangakaId);

    
    Task<List<ChapterDto>> GetChaptersBySeries(Guid seriesId, Guid requestUserId);

    
    Task<SeriesRankingContainerDto> GetSeriesRanking(string? genre, string? sortBy, string? timeframe);
}
