using MangaStudio.Backend.Models.DTOs;

namespace MangaStudio.Backend.Services.Interfaces;


public interface IWorkflowService
{
    

    
    Task<List<ProposalDto>> GetPendingProposals();

    
    Task<List<ProposalDto>> GetProposalsByMangaka(Guid mangakaId);

    
    Task<ProposalDto> ReviewProposal(Guid proposalId, Guid tantouId, ReviewProposalDto dto);

    Task<List<UserOptionDto>> GetUsersByRole(string roleCode);

    

    
    Task<List<PublishScheduleDto>> GetPublishSchedules(Guid? seriesId = null);

    
    Task<PublishScheduleDto> CreatePublishSchedule(Guid chapterId, Guid createdById, CreatePublishScheduleDto dto);

    
    Task<PublishScheduleDto> ApprovePublishSchedule(Guid scheduleId, Guid tantouId);

    
    Task<PublishScheduleDto> CancelPublishSchedule(Guid scheduleId, Guid editorialId);

    

    
    Task<List<PayrollDto>> GetPayrollRecords(Guid? assistantId = null, Guid? mangakaId = null);

    Task<List<AssistantPayrollMonthDto>> GetAssistantPayrollMonths(Guid assistantId);

    
    Task<PayrollDto> MarkPayrollAsPaid(Guid payrollRecordId, Guid mangakaId);

    
    Task<List<NotificationDto>> GetNotifications(Guid userId);
    Task<bool> MarkAsRead(Guid id, Guid userId);
    Task<bool> MarkAllAsRead(Guid userId);
}
