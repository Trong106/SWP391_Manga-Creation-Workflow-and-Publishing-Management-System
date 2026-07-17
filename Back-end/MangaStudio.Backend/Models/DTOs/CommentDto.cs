using System;
using System.ComponentModel.DataAnnotations;

namespace MangaStudio.Backend.Models.DTOs;

/// <summary>DTO hiển thị bình luận trang truyện.</summary>
public class CommentDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string? Avatar { get; set; }
    public string Body { get; set; } = null!;
    public string CreatedAt { get; set; } = null!;
}

/// <summary>DTO tạo bình luận trang truyện mới.</summary>
public class CreateCommentDto
{
    [Required(ErrorMessage = "Comment body is required.")]
    public string Body { get; set; } = null!;
}
