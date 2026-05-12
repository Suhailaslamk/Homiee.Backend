using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Homiee.Infrastructure.SignalR;
using Homiee.Presentation.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly UserConnectionManager _manager;

        public ChatController(
            IChatService chatService,
            IHubContext<ChatHub> hubContext,
            UserConnectionManager manager)
        {
            _chatService = chatService;
            _hubContext = hubContext;
            _manager = manager;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id))
                throw new UnauthorizedAccessException("Invalid token");
            return id;
        }

        [HttpGet("inbox")]
        public async Task<IActionResult> GetInbox()
        {
            var userId = GetUserId();
            var data = await _chatService.GetInboxAsync(userId);
            return Ok(data);
        }

        [HttpGet("{otherUserId:int}")]
        public async Task<IActionResult> GetConversation(int otherUserId)
        {
            var userId = GetUserId();
            var data = await _chatService.GetConversationAsync(userId, otherUserId);
            return Ok(data);
        }

        [HttpPut("{senderId:int}/read")]
        public async Task<IActionResult> MarkAsRead(int senderId)
        {
            var receiverId = GetUserId();
            await _chatService.MarkAsReadAsync(senderId, receiverId);
            return Ok();
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            var senderId = GetUserId();

            var msg = await _chatService.SendMessageAsync(
                senderId,
                dto.ReceiverId,
                dto.Message
            );

            // 🔥 Send to receiver in real-time
            var connections = _manager.GetConnections(dto.ReceiverId);
            foreach (var conn in connections)
            {
                await _hubContext.Clients.Client(conn)
                    .SendAsync("ReceiveMessage", msg);
            }

            // 🔥 Also send back to sender (multi-tab sync)
            var senderConnections = _manager.GetConnections(senderId);
            foreach (var conn in senderConnections)
            {
                await _hubContext.Clients.Client(conn)
                    .SendAsync("ReceiveMessage", msg);
            }

            return Ok(msg);
        }
    }
}