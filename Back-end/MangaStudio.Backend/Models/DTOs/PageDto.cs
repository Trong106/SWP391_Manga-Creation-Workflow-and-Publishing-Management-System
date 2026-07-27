namespace MangaStudio.Backend.Models.DTOs;


public class PageDto
{
    public Guid PageId { get; set; }
    public Guid ChapterId { get; set; }
    public int PageNumber { get; set; }
    public string? CurrentImageUrl { get; set; }
    public string? OriginalFileName { get; set; }
    public string Status { get; set; } = null!;
    public Guid? UploadedById { get; set; }
    public string? UploadedByName { get; set; }
    public DateTime? UploadedAt { get; set; }
    public int TaskCount { get; set; }
    public int AnnotationCount { get; set; }
    public List<AnnotationDto> Annotations { get; set; } = new();
}


public class UploadPagesResponseDto
{
    public int TotalUploaded { get; set; }
    public List<PageUploadResultDto> Pages { get; set; } = new();
}


public class PageUploadResultDto
{
    public Guid PageId { get; set; }
    public int PageNumber { get; set; }
    public string ImageUrl { get; set; } = null!;
    public string OriginalFileName { get; set; } = null!;
    public string Status { get; set; } = null!;
}
