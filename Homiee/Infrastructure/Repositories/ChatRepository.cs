using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Repositories
{
    public class ChatRepository : IChatRepository
    {
        private readonly AppDbContext _context;

        public ChatRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ChatMessage message)
        {
            await _context.ChatMessages.AddAsync(message);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<List<ChatMessage>> GetConversation(int user1, int user2)
        {
            return await _context.ChatMessages
                .Where(m =>
                    (m.SenderId == user1 && m.ReceiverId == user2) ||
                    (m.SenderId == user2 && m.ReceiverId == user1))
                .OrderBy(m => m.SentAt)
                .ToListAsync();
        }

        public async Task<List<ConversationSummaryDto>> GetInboxAsync(int userId)
        {
            var conversations = await _context.ChatMessages
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();

            return conversations
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g => 
                {
                    var otherId = g.Key;
                    var lastMsg = g.First();
                    
                    // Priority: Seller Business Name > User Name > ID
                    var sellerName = _context.Sellers.Where(s => s.UserId == otherId).Select(s => s.BusinessName).FirstOrDefault();
                    var userName = _context.Users.Where(u => u.Id == otherId).Select(u => u.Name).FirstOrDefault();
                    
                    return new ConversationSummaryDto
                    {
                        OtherUserId = otherId,
                        OtherUserName = sellerName ?? userName ?? $"User {otherId}",
                        OtherUserAvatar = _context.Users.Where(u => u.Id == otherId).Select(u => u.ProfilePictureUrl).FirstOrDefault(),
                        LastMessage = lastMsg.Message,
                        LastMessageAt = lastMsg.SentAt,
                        UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
                    };
                })
                .OrderByDescending(c => c.LastMessageAt)
                .ToList();
        }

        public async Task MarkAsReadAsync(int senderId, int receiverId)
        {
            var unread = await _context.ChatMessages
                .Where(m => m.SenderId == senderId && m.ReceiverId == receiverId && !m.IsRead)
                .ToListAsync();

            unread.ForEach(m => m.IsRead = true);
            await _context.SaveChangesAsync();
        }
    }
}