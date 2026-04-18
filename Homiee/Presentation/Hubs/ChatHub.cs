using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Presentation.Hubs
{
    public class ChatHub : Hub
    {
        private readonly IChatRepository _repo;
        private readonly UserConnectionManager _manager;

        public ChatHub(IChatRepository repo, UserConnectionManager manager)
        {
            _repo = repo;
            _manager = manager;
        }

        public async Task SendMessage(int receiverId, string message)
        {
            var senderId = int.Parse(Context.User.FindFirst("userId")!.Value);

            var chat = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message
            };

            await _repo.AddAsync(chat);
            await _repo.SaveChangesAsync();

            var receiverConn = _manager.GetConnection(receiverId);

            if (receiverConn != null)
            {
                await Clients.Client(receiverConn)
                    .SendAsync("ReceiveMessage", chat);
            }
        }
    }
}
