using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IServices
{
    public interface INotificationService
    {
        Task SendAsync(int userId, string title, string message);
        Task<List<Notification>> GetUserNotifications(int userId);
    }
}
