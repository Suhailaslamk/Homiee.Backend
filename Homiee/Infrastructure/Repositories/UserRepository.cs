using Homiee.Application.Interfaces.IRepository;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Homiee.Domain.Entities;


namespace Homiee.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;
        public UserRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<bool> ExistsByEmailAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
        }
        public async Task<User?> GetByIdAsync(int id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        }
        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted );
        }
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
        public IQueryable<User> Query()
        {
            return _context.Users.Where(u => !u.IsDeleted);
        }



    }
}
