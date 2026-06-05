using Homiee.Modules.Notifications.Application.Dtos;

namespace Homiee.Modules.Notifications.Application.IServices;

public interface INotificationDispatcher
{
    Task DispatchAsync(int userId, NotificationDto notification);
}
