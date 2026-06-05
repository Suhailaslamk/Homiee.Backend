using Homiee.Modules.Notifications.Api.Hubs;
using Homiee.Modules.Notifications.Application.Dtos;
using Homiee.Modules.Notifications.Application.IServices;
using Microsoft.AspNetCore.SignalR;

namespace Homiee.Modules.Notifications.Infrastructure.SignalR;

public class SignalRNotificationDispatcher : INotificationDispatcher
{
    private readonly IHubContext<NotificationHub> _hub;

    public SignalRNotificationDispatcher(IHubContext<NotificationHub> hub)
    {
        _hub = hub;
    }

    public Task DispatchAsync(int userId, NotificationDto notification)
    {
        return _hub.Clients.User(userId.ToString())
            .SendAsync("ReceiveNotification", notification);
    }
}
