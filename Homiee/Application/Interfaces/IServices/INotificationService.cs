using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Presentation.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Homiee.Application.Interfaces.IServices
{
    public interface INotificationService
    {
        Task SendAsync(int userId, string title, string message);
        Task<ApiResponse<List<NotificationDto>>> GetUserNotifications(int userId);
        Task<ApiResponse<bool>> MarkAsRead(int id, int userId);
    }
}







