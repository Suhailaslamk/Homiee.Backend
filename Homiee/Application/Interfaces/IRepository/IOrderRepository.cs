using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace Homiee.Application.Interfaces.IRepository
{
    public interface IOrderRepository
    {
        Task AddAsync(Order order);
        Task<List<Order>> GetByUserIdAsync(int userId);
        Task SaveChangesAsync();
        Task<Order?> GetByIdAsync(int id);
        IQueryable<Order> Query();
        Task<Order?> GetOrderWithDetailsAsync(int orderId);







    }
}