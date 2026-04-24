using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Homiee.Presentation.Hubs;
using Homiee.Common;

namespace Homiee.Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repo;
        private readonly IHubContext<NotificationHub> _hub;

        public NotificationService(
            INotificationRepository repo,
            IHubContext<NotificationHub> hub)
        {
            _repo = repo;
            _hub = hub;
        }

        public async Task SendAsync(int userId, string title, string message)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                CreatedAt = DateTime.UtcNow
            };

            await _repo.AddAsync(notification);
            await _repo.SaveChangesAsync();

            var dto = new NotificationDto
            {
                Id = notification.Id,
                Title = notification.Title,
                Message = notification.Message,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };

            // ✅ Single correct SignalR call
            await _hub.Clients.User(userId.ToString())
                .SendAsync("ReceiveNotification", dto);
        }

        public async Task<ApiResponse<List<NotificationDto>>> GetUserNotifications(int userId)
        {
            var notifications = await _repo.GetByUserIdAsync(userId);

            var result = notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            }).ToList();

            return new ApiResponse<List<NotificationDto>>(
                200,
                "Notifications fetched",
                result
            );
        }

        public async Task<ApiResponse<bool>> MarkAsRead(int id, int userId)
        {
            var notif = await _repo.GetByIdAsync(id);

            if (notif == null)
                return new ApiResponse<bool>(404, "Notification not found", false);

            if (notif.UserId != userId)
                return new ApiResponse<bool>(403, "Forbidden", false);

            if (notif.IsRead)
                return new ApiResponse<bool>(200, "Already marked as read", true);

            notif.IsRead = true;

            await _repo.SaveChangesAsync();

            return new ApiResponse<bool>(200, "Marked as read", true);
        }
    }
}