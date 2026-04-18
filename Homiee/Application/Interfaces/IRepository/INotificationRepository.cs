using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface INotificationRepository
    {
        Task AddAsync(Notification notification);
        Task<List<Notification>> GetByUserIdAsync(int userId);
        Task<Notification?> GetByIdAsync(int id);
        Task SaveChangesAsync();
    }
}
