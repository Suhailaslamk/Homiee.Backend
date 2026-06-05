using Homiee.Modules.Notifications.Domain.Entities;

namespace Homiee.Modules.Notifications.Application.IRepositories
{
    public interface INotificationRepository
    {
        Task AddAsync(Notification notification);
        Task<List<Notification>> GetByUserIdAsync(int userId);
        Task<Notification?> GetByIdAsync(int id);
        Task SaveChangesAsync();
    }
}
