using Homiee.Application.Interfaces.IServices;
using Homiee.Infrastructure.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Homiee.Presentation.Hubs
{
    [Authorize] // ❌ Was missing
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService; // ❌ Was using IChatRepository directly
        private readonly UserConnectionManager _manager;

        public ChatHub(IChatService chatService, UserConnectionManager manager)
        {
            _chatService = chatService;
            _manager = manager;
        }

        // ❌ Was missing entirely — connections were NEVER registered
        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            _manager.AddConnection(userId, Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        // ❌ Was missing entirely
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            _manager.RemoveConnection(userId, Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(int receiverId, string message)
        {
            var senderId = GetUserId();

            var msgDto = await _chatService.SendMessageAsync(senderId, receiverId, message);

            // ❌ Was missing — sender tab must also receive the message
            await Clients.Caller.SendAsync("ReceiveMessage", msgDto);

            // Send to ALL receiver connections (multi-tab support)
            var receiverConns = _manager.GetConnections(receiverId);
            foreach (var conn in receiverConns)
            {
                await Clients.Client(conn).SendAsync("ReceiveMessage", msgDto);
            }
        }

        private int GetUserId() =>
            int.Parse(Context.User!.FindFirst("userId")!.Value);
    }
}