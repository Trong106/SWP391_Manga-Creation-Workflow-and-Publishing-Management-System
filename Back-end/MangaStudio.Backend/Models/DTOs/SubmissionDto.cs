using System.ComponentModel.DataAnnotations;

namespace MangaStudio.Backend.Models.DTOs;


public class TaskSubmissionDto
{
    public Guid SubmissionId { get; set; }
    public Guid TaskId { get; set; }
    public string TaskTitle { get; set; } = null!;
    public Guid SubmittedById { get; set; }
    public string SubmittedByName { get; set; } = null!;
    public Guid? PageVersionId { get; set; }
    public string? FileUrl { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = null!;
    public DateTime SubmittedAt { get; set; }
}


public class SubmitTaskDto
{
    public string? Note { get; set; }
    
}


public class ReviewSubmissionDto
{
    [Required]
    [RegularExpression("^(approved|rejected)$", ErrorMessage = "Decision must be 'approved' or 'rejected'.")]
    public string Decision { get; set; } = null!;

    public string? Note { get; set; }
}


public class PageVersionDto
{
    public Guid PageVersionId { get; set; }
    public Guid PageId { get; set; }
    public int VersionNumber { get; set; }
    public string FileUrl { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public long? FileSizeBytes { get; set; }
    public string? MimeType { get; set; }
    public Guid UploadedById { get; set; }
    public string UploadedByName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public string? Note { get; set; }
    public List<AnnotationDto> Annotations { get; set; } = new();
}
