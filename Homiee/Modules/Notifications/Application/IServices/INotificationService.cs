using Homiee.Modules.Notifications.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Notifications.Application.IServices
{
    public interface INotificationService
    {
        Task SendAsync(int userId, string title, string message);
        Task<ApiResponse<List<NotificationDto>>> GetUserNotifications(int userId);
        Task<ApiResponse<bool>> MarkAsRead(int id, int userId);
    }
}
