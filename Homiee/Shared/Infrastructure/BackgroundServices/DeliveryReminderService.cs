using Homiee.Modules.Notifications.Application.IServices;
using Homiee.Shared.Domain.Enums;
using Homiee.Shared.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Shared.Infrastructure.BackgroundServices
{
    public class DeliveryReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DeliveryReminderService> _logger;

        public DeliveryReminderService(IServiceProvider serviceProvider, ILogger<DeliveryReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Delivery Reminder Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SendReminders(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while sending delivery reminders.");
                }

                // Wait for 1 hour
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }

            _logger.LogInformation("Delivery Reminder Service is stopping.");
        }

        private async Task SendReminders(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var tomorrow = DateTime.UtcNow.Date.AddDays(1);

            var ordersDueTomorrow = await dbContext.Orders
                .Where(o => o.RequestedDeliveryDate.HasValue 
                         && o.RequestedDeliveryDate.Value.Date == tomorrow
                         && o.Status != OrderStatus.Delivered
                         && o.Status != OrderStatus.Cancelled
                         && o.Status != OrderStatus.Rejected)
                .ToListAsync(stoppingToken);

            _logger.LogInformation("Found {Count} orders scheduled for delivery on {Tomorrow}", ordersDueTomorrow.Count, tomorrow);

            foreach (var order in ordersDueTomorrow)
            {
                await notificationService.SendAsync(
                    order.SellerId,
                    "Delivery Reminder",
                    $"Reminder: Order #{order.Id} is scheduled for delivery tomorrow ({order.RequestedDeliveryDate.Value:MMM dd, yyyy})."
                );
            }
        }
    }
}
