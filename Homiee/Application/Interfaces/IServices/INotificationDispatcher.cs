using Homiee.Application.DTOs;

namespace Homiee.Application.Interfaces.IServices;

public interface INotificationDispatcher
{
    Task DispatchAsync(int userId, NotificationDto notification);
}
