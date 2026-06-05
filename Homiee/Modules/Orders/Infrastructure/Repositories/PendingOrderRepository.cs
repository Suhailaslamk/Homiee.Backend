using Homiee.Modules.Orders.Application.IRepositories;
using Homiee.Modules.Orders.Domain.Entities;
using Homiee.Shared.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Modules.Orders.Infrastructure.Repositories
{
    public class PendingOrderRepository : IPendingOrderRepository
    {
        private readonly AppDbContext _context;

        public PendingOrderRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(PendingOrder pendingOrder)
        {
            await _context.PendingOrders.AddAsync(pendingOrder);
        }
        public async Task<PendingOrder?> GetByRazorpayOrderIdAsync(string razorpayOrderId)
        {
            return await _context.PendingOrders
                .FirstOrDefaultAsync(p => p.RazorpayOrderId == razorpayOrderId);
        }
        public async Task<PendingOrder?> GetByIdAsync(int id)
        {
            return await _context.PendingOrders.FindAsync(id);
        }
        
        public async Task<PendingOrder?> GetByUserIdAsync(int userId)
        {
            return await _context.PendingOrders
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task DeleteAsync(PendingOrder pendingOrder)
        {
            _context.PendingOrders.Remove(pendingOrder);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
