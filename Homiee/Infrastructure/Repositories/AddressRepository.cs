using Homiee.Application.Interfaces.IRepository;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Repositories
{
    public class AddressRepository : IAddressRepository
    {
        private readonly AppDbContext _context;

        public AddressRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Address>> GetByUserIdAsync(int userId)
            => await _context.Addresses.Where(x => x.UserId == userId).ToListAsync();

        public async Task<Address?> GetByIdAsync(int id)
            => await _context.Addresses.FindAsync(id);

        public async Task AddAsync(Address address)
            => await _context.Addresses.AddAsync(address);

        public async Task DeleteAsync(Address address)
            => _context.Addresses.Remove(address);

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}
