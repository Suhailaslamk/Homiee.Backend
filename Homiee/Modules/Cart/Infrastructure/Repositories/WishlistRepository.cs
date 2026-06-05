using Homiee.Modules.Cart.Application.IRepositories;
using Homiee.Modules.Cart.Domain.Entities;
using Homiee.Shared.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Modules.Cart.Infrastructure.Repositories
{
    public class WishlistRepository : IWishlistRepository
    {
        private readonly AppDbContext _context;

        public WishlistRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsAsync(int userId, int productId)
        {
            return await _context.Set<Wishlist>()
                .AsNoTracking()
                .AnyAsync(w => w.UserId == userId && w.ProductId == productId);
        }

        public Task AddAsync(Wishlist wishlist)
        {
            _context.Set<Wishlist>().Add(wishlist);
            return Task.CompletedTask;
        }

        public Task RemoveAsync(Wishlist wishlist)
        {
            _context.Set<Wishlist>().Remove(wishlist);
            return Task.CompletedTask;
        }

        public async Task<Wishlist?> GetAsync(int userId, int productId)
        {
            return await _context.Set<Wishlist>()
                .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);
        }

        public async Task<List<Wishlist>> GetByUserIdAsync(int userId)
        {
            return await _context.Set<Wishlist>()
                .Where(w => w.UserId == userId)
                .AsNoTracking()
                .Include(w => w.Product)
                    .ThenInclude(p => p.Images)
                .ToListAsync();
        }

        public Task RemoveRangeAsync(List<Wishlist> items)
        {
            _context.Set<Wishlist>().RemoveRange(items);
            return Task.CompletedTask;
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}