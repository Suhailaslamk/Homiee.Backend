using Homiee.Infrastructure.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

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
            var userId = int.Parse(Context.User.FindFirst("userId")!.Value);

            _manager.AddConnection(userId, Context.ConnectionId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = int.Parse(Context.User.FindFirst("userId")!.Value);

            _manager.RemoveConnection(userId);

            await base.OnDisconnectedAsync(exception);
        }
    }
}
