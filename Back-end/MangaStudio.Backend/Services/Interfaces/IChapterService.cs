using MangaStudio.Backend.Models.DTOs;

namespace MangaStudio.Backend.Services.Interfaces;


public interface IChapterService
{
    
    Task<ChapterDto> CreateChapter(Guid seriesId, Guid mangakaId, CreateChapterDto dto);

    
    Task<ChapterDto> GetChapterById(Guid chapterId);

    
    Task<ChapterDto> UpdateChapter(Guid chapterId, Guid mangakaId, UpdateChapterDto dto);

    
    Task<List<PageDto>> GetPagesByChapter(Guid chapterId);

    
    Task<UploadPagesResponseDto> UploadPages(Guid chapterId, List<IFormFile> files, Guid uploadedById);

    
    System.Threading.Tasks.Task DeletePage(Guid pageId, Guid mangakaId);

    
    Task<ChapterDto> SubmitChapterForPublishing(Guid chapterId, Guid mangakaId);

    Task<ChapterDto> ReviewChapter(Guid chapterId, Guid tantouId, ReviewChapterDto dto);

    Task<ChapterVersionCompareDto> GetChapterVersions(Guid chapterId);
}
