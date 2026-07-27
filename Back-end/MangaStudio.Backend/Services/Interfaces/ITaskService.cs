using MangaStudio.Backend.Models.DTOs;

namespace MangaStudio.Backend.Services.Interfaces;


public interface ITaskService
{
    
    Task<TaskDto> CreateTask(Guid pageId, Guid assignerId, CreateTaskDto dto);

    
    Task<List<TaskDto>> GetTasksByPage(Guid pageId);

    
    Task<List<TaskDto>> GetMyTasks(Guid assistantId);

    
    Task<TaskDto> UpdateTask(Guid taskId, Guid mangakaId, UpdateTaskDto dto);

    Task<TaskDto> ReTask(Guid taskId, Guid mangakaId, ReTaskDto dto);

    
    Task<TaskSubmissionDto> SubmitTask(Guid taskId, Guid assistantId, string? note, IFormFile? file);

    
    Task<List<TaskSubmissionDto>> GetSubmissions(Guid taskId);

    
    Task<TaskSubmissionDto> ReviewSubmission(Guid submissionId, Guid reviewerId, ReviewSubmissionDto dto);

    
    Task<List<AssistantDto>> GetAllAssistants();

    
    Task<TaskDto> StartTask(Guid taskId, Guid assistantId);

    Task<NotificationDto> AskClarification(Guid taskId, Guid assistantId, AskClarificationDto dto);

    
    Task<TaskResourceDto?> GetTaskResource(Guid taskId);
}
