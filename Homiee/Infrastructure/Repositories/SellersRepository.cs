using Homiee.Application.Interfaces.IRepository;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Application.DTOs;
using Homiee.Domain.Enums;
using Homiee.Infrastructure.Data;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Repositories
{
    

    public class SellersRepository : ISellersRepository
    {
        private readonly AppDbContext _context;

        public SellersRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Seller seller)
        {
            await _context.Sellers.AddAsync(seller);
        }

        public async Task<Seller?> GetByUserIdAsync(int userId)
        {
            return await _context.Sellers
                .FirstOrDefaultAsync(x => x.UserId == userId);
        }
        public IQueryable<Seller> Query()
        {
            return _context.Sellers;
        }
        public async Task<PagedResult<Seller>> GetFilteredAsync(SellerQueryParamsDto queryParams)
        {
            var query = _context.Sellers
    .Include(s => s.User)
    .Include(s => s.Products)   // ADD THIS
    .AsQueryable();

            // 🔍 FILTER BY STATUS
            if (!string.IsNullOrEmpty(queryParams.Status) &&
                Enum.TryParse<ApprovalStatus>(queryParams.Status, true, out var status))
            {
                query = query.Where(s => s.Status == status);
            }

            // 🔎 SEARCH (Name / Email / GST)
            if (!string.IsNullOrEmpty(queryParams.Search))
            {
                var search = queryParams.Search.ToLower();

                query = query.Where(s =>
                    s.BusinessName.ToLower().Contains(search) ||
                    s.GSTNumber.ToLower().Contains(search) ||
                    s.User.Email.ToLower().Contains(search) ||
                    s.User.Name.ToLower().Contains(search)
                );
            }

            // 📊 TOTAL COUNT (before pagination)
            var totalCount = await query.CountAsync();

            // 🔃 SORTING
            query = queryParams.SortBy?.ToLower() switch
            {
                "name" => queryParams.Desc
                    ? query.OrderByDescending(s => s.BusinessName)
                    : query.OrderBy(s => s.BusinessName),

                "created" => queryParams.Desc
                    ? query.OrderByDescending(s => s.CreatedOn)
                    : query.OrderBy(s => s.CreatedOn),

                _ => query.OrderByDescending(s => s.CreatedOn) // default
            };

            // 📄 PAGINATION
            var data = await query
                .Skip((queryParams.Page - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            return new PagedResult<Seller>
            {
                StatusCode = 200,
                Data = data,
                TotalCount = totalCount,
                Page = queryParams.Page,
                PageSize = queryParams.PageSize
            };
        }
        public async Task<bool> ExistsByPhoneAsync(string phone, int userId)
        {
            return await _context.Sellers
                .AnyAsync(x => x.PhoneNumber == phone && x.UserId != userId);
        }
        public async Task<bool> ExistsByGstAsync(string gst, int userId)
        {
            return await _context.Sellers
                .AnyAsync(x => x.GSTNumber == gst && x.UserId != userId);
        }
        public async Task<Seller?> GetWithUserAsync(int userId)
        {
            return await _context.Sellers
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);
        }
        public async Task<List<Seller>> GetByStatusAsync(ApprovalStatus status)
        {
            return await _context.Sellers
                .Where(s => s.Status == status)
                .ToListAsync();
        }
        public async Task<bool> ExistsByUserIdAsync(int userId)
        {
            return await _context.Sellers
                .AnyAsync(s => s.UserId == userId);
        }
        public async Task<List<Seller>> GetPagedAsync(int page, int pageSize)
        {
            return await _context.Sellers
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
