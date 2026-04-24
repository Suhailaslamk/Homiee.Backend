using Homiee.Infrastructure.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Homiee.Presentation.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly UserConnectionManager _manager;

        public NotificationHub(UserConnectionManager manager)
        {
            _manager = manager;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            _manager.AddConnection(userId, Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            // ✅ Pass connectionId — won't remove user if they're still on ChatHub
            _manager.RemoveConnection(userId, Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        private int GetUserId() =>
            int.Parse(Context.User!.FindFirst("userId")!.Value);
    }
}