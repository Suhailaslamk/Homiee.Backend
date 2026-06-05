using Homiee.Modules.Identity.Application.IRepository;
using Homiee.Modules.Identity.Domain.Entities;
using Homiee.Shared.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Modules.Identity.Infrastructure.Repositories
{
    public class DeliveryRepository : IDeliveryRepository
    {
        private readonly AppDbContext _context;

        public DeliveryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(DeliveryPartner delivery)
        {
            await _context.DeliveryPartners.AddAsync(delivery);
        }

        public async Task<DeliveryPartner?> GetByUserIdAsync(int userId)
        {
            return await _context.DeliveryPartners
                .FirstOrDefaultAsync(x => x.UserId == userId);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}