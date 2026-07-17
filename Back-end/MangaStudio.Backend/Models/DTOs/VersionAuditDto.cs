namespace MangaStudio.Backend.Models.DTOs;

public class PageVersionOptionDto : PageVersionDto
{
    public bool IsCurrent { get; set; }
}

public class ChapterVersionPageDto
{
    public Guid PageId { get; set; }
    public int PageNumber { get; set; }
    public string Status { get; set; } = null!;
    public string CurrentImageUrl { get; set; } = null!;
    public bool ChangedAfterRevision { get; set; }
    public List<PageVersionOptionDto> Versions { get; set; } = new();
}

public class ChapterVersionCompareDto
{
    public Guid ChapterId { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime? TantouReviewedAt { get; set; }
    public List<ChapterVersionPageDto> Pages { get; set; } = new();
}

