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

        /// <summary>
        /// Direct WebSocket invocation path — NOT used by the current frontend.
        /// The frontend sends messages via REST POST /api/chat/send, which 
        /// handles SignalR delivery via ChatController.
        /// This method is retained for potential future native/mobile clients.
        /// Do NOT remove without updating the frontend to invoke it.
        /// </summary>
        public async Task SendMessage(int receiverId, string message)
        {
            var senderId = GetUserId();

            var msgDto = await _chatService.SendMessageAsync(senderId, receiverId, message);

            // 🔥 Send to both sender and receiver (multi-tab support)
            await Clients.User(senderId.ToString()).SendAsync("ReceiveMessage", msgDto);
            await Clients.User(receiverId.ToString()).SendAsync("ReceiveMessage", msgDto);
        }

        private int GetUserId() =>
            int.Parse(Context.User!.FindFirst("userId")!.Value);
    }
}