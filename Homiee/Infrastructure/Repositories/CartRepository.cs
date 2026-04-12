using Homiee.Application.Interfaces.IRepository;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Repositories
{
    public class CartRepository : ICartRepository
    {
        private readonly AppDbContext _context;

        public CartRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<CartItem>> GetCartItems(int customerId)
        {
            return await _context.CartItems
                .Where(x => x.CustomerId == customerId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<CartItem?> GetCartItem(int customerId, int productId)
        {
            return await _context.CartItems
                .FirstOrDefaultAsync(x =>
                    x.CustomerId == customerId &&
                    x.ProductId == productId);
        }

        public async Task AddAsync(CartItem item)
        {
            await _context.CartItems.AddAsync(item);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(CartItem item)
        {
            _context.CartItems.Update(item);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(CartItem item)
        {
            _context.CartItems.Remove(item);
            await _context.SaveChangesAsync();
        }
    }
}
