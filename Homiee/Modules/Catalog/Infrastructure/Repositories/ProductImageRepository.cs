using Homiee.Modules.Catalog.Application.IRepository;
using Homiee.Modules.Catalog.Domain.Entities;
using Homiee.Shared.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Modules.Catalog.Infrastructure.Repositories
{
    
        public class ProductImageRepository : IProductImageRepository
        {
            private readonly AppDbContext _context;

            public ProductImageRepository(AppDbContext context)
            {
                _context = context;
            }

            public async Task AddAsync(ProductImage image)
            {
                await _context.ProductImages.AddAsync(image);
            }

            public async Task SaveChangesAsync()
            {
                await _context.SaveChangesAsync();
            }
            public async Task<List<ProductImage>> GetByProductIdAsync(int productId)
            {
                return await _context.ProductImages
                    .Where(x => x.ProductId == productId)
                    .ToListAsync();
            }
            
            public async Task<ProductImage?> GetByIdAsync(int id)
            {
                return await _context.ProductImages.FindAsync(id);
            }
            
            public async Task RemoveAsync(ProductImage image)
            {
                _context.ProductImages.Remove(image);
                await Task.CompletedTask;
            }
        }
}
        
