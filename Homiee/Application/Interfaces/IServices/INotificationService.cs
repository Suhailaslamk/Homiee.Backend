using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface INotificationService
    {
        Task SendAsync(int userId, string title, string message);
        Task<ApiResponse<List<NotificationDto>>> GetUserNotifications(int userId);
        Task<ApiResponse<bool>> MarkAsRead(int id, int userId);
    }
}
