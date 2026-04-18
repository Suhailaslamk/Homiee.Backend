using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Homiee.Presentation.Hubs;




namespace Homiee.Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repo;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly ConnectionManager _connectionManager = ConnectionManager.Instance;

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
                Message = message
            };

            await _repo.AddAsync(notification);
            await _repo.SaveChangesAsync();


            var connectionId = _connectionManager.GetConnection(userId);

            if (connectionId != null)
            {
                await _hub.Clients.Client(connectionId)
                    .SendAsync("ReceiveNotification", notification);
            }
            // 🔥 REAL-TIME PUSH
            await _hub.Clients.User(userId.ToString())
                .SendAsync("ReceiveNotification", new
                {
                    title,
                    message,
                    createdAt = notification.CreatedAt
                });
        }

        public async Task<List<Notification>> GetUserNotifications(int userId)
        {
            return await _repo.GetByUserIdAsync(userId);
        }
    }
}
