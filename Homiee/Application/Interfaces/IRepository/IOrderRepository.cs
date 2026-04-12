using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
namespace Homiee.Application.Interfaces.IRepository
{
    public interface IOrderRepository
    {
        Task AddAsync(Order order);
        Task<List<Order>> GetByUserIdAsync(int userId);
        Task SaveChangesAsync();
        Task<Order?> GetByIdAsync(int id);
        IQueryable<Order> Query();






    }
}