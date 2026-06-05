using Homiee.Modules.Catalog.Application.IRepository;
using Homiee.Modules.Catalog.Domain.Entities;
using Homiee.Shared.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Modules.Catalog.Infrastructure.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly AppDbContext _context;

        public ProductRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Product product)
        {
            await _context.Products.AddAsync(product);
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            return await _context.Products.FindAsync(id);
        }

        public IQueryable<Product> Query()
        {
            return _context.Products;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
        public async Task<Product> GetByIdWithImagesAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);
        }
        public async Task<List<Product>> GetCandidatesForRecommendationAsync(
            int categoryId,
            int sellerId,
            CancellationToken cancellationToken = default)
        {
            // Pull only same-category OR same-seller products.
            // Keeps the scoring pool small — no full catalog scan.
            return await _context.Products
                .AsNoTracking()
                .Where(p => !p.IsDeleted && (p.CategoryId == categoryId || p.SellerId == sellerId))
                .Include(p => p.Images)
                .ToListAsync(cancellationToken);
        }
    }
    }

