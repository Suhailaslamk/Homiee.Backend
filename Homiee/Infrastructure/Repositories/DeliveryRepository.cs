using Homiee.Application.Interfaces.IRepository;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Repositories
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