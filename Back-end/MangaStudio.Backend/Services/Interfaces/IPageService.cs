using MangaStudio.Backend.Models.DTOs;

namespace MangaStudio.Backend.Services.Interfaces;


public interface IPageService
{
    
    Task<PageDto> GetPageById(Guid pageId);

    
    Task<List<AnnotationDto>> GetAnnotations(Guid pageId);

    
    Task<AnnotationDto> CreateAnnotation(Guid pageId, Guid createdById, CreateAnnotationDto dto);

    
    Task<AnnotationDto> ResolveAnnotation(Guid annotationId, Guid userId);

    System.Threading.Tasks.Task DeleteAnnotation(Guid annotationId, Guid userId);

    
    Task<List<PageReviewDto>> GetPageReviews(Guid pageId);

    Task<List<PageVersionOptionDto>> GetPageVersions(Guid pageId);

    
    Task<PageReviewDto> CreatePageReview(Guid pageId, Guid reviewerId, CreatePageReviewDto dto);

    
    Task<CommentDto> CreatePageComment(Guid pageId, Guid userId, CreateCommentDto dto);
}
