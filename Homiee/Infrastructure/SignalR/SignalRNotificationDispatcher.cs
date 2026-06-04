using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Homiee.Presentation.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Homiee.Infrastructure.SignalR;

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
