using Homiee.Application.Interfaces.IRepository;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly AppDbContext _context;

        public ReviewRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Review review)
            => await _context.Reviews.AddAsync(review);

        public async Task<List<Review>> GetByProductId(int productId)
            => await _context.Reviews
                .Where(r => r.ProductId == productId)
                .ToListAsync();

        public async Task<bool> Exists(int userId, int productId)
            => await _context.Reviews
                .AnyAsync(r => r.UserId == userId && r.ProductId == productId);

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}
