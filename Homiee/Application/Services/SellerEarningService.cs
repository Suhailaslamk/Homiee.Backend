using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Homiee.Application.Interfaces.IData;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Application.Services
{
    public class SellerEarningService : ISellerEarningService
    {
        private readonly IApplicationDbContext _dbContext;
        private readonly ISellersRepository _sellerRepo;

        public SellerEarningService(IApplicationDbContext dbContext, ISellersRepository sellerRepo)
        {
            _dbContext = dbContext;
            _sellerRepo = sellerRepo;
        }

        public async Task CreateEarningForOrder(int sellerId, int orderId, decimal amount)
        {
            // Idempotent — don't double-credit if called twice
            var exists = await _dbContext.Set<SellerEarning>()
                .AnyAsync(e => e.OrderId == orderId && e.SellerId == sellerId);

            if (exists) return;

            var earning = new SellerEarning(sellerId, orderId, amount);
            _dbContext.Set<SellerEarning>().Add(earning);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<ApiResponse<SellerEarningsDto>> GetEarnings(
            int userId, int page = 1, int pageSize = 20)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<SellerEarningsDto>(404, "Seller not found");

            var earningsQuery = _dbContext.Set<SellerEarning>()
                .Where(e => e.SellerId == seller.Id)
                .AsNoTracking();

            // Aggregate totals
            var totals = await earningsQuery
                .GroupBy(e => 1)
                .Select(g => new
                {
                    Total = g.Sum(e => e.Amount),
                    Pending = g.Where(e => e.Status == EarningStatus.Pending).Sum(e => e.Amount),
                    Available = g.Where(e => e.Status == EarningStatus.Available).Sum(e => e.Amount),
                    Paid = g.Where(e => e.Status == EarningStatus.Paid).Sum(e => e.Amount)
                })
                .FirstOrDefaultAsync();

            var totalCount = await earningsQuery.CountAsync();

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 50) pageSize = 20;

            var items = await earningsQuery
                .OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EarningItemDto
                {
                    EarningId = e.Id,
                    OrderId = e.OrderId,
                    Amount = e.Amount,
                    Status = e.Status.ToString(),
                    CreatedAt = e.CreatedAt,
                    AvailableAt = e.AvailableAt,
                    PaidAt = e.PaidAt
                })
                .ToListAsync();

            var dto = new SellerEarningsDto
            {
                TotalEarned = totals?.Total ?? 0,
                PendingAmount = totals?.Pending ?? 0,
                AvailableAmount = totals?.Available ?? 0,
                PaidOutAmount = totals?.Paid ?? 0,
                Earnings = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return new ApiResponse<SellerEarningsDto>(200, "Success", dto);
        }

        public async Task<ApiResponse<string>> ProcessPayout(int sellerId)
        {
            var available = await _dbContext.Set<SellerEarning>()
                .Where(e => e.SellerId == sellerId && e.Status == EarningStatus.Available)
                .ToListAsync();

            if (!available.Any())
                return new ApiResponse<string>(400, "No available earnings to pay out");

            foreach (var earning in available)
                earning.MarkPaid();

            await _dbContext.SaveChangesAsync();

            var total = available.Sum(e => e.Amount);
            return new ApiResponse<string>(200, $"Payout processed: ?{total:F2} across {available.Count} order(s)");
        }
        /// <inheritdoc/>
        public async Task<ApiResponse<string>> ReleaseEarnings(int userId, int holdDays = 7)
        {

            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");
            var cutoff = DateTime.UtcNow.AddDays(-holdDays);

            var pending = await _dbContext.Set<SellerEarning>()
                .Where(e => e.SellerId == seller.Id
                         && e.Status == EarningStatus.Pending
                         && e.CreatedAt <= cutoff)
                .ToListAsync();

            if (!pending.Any())
                return new ApiResponse<string>(400, "No pending earnings ready to release");

            foreach (var earning in pending)
                earning.MarkAvailable();

            await _dbContext.SaveChangesAsync();

            var total = pending.Sum(e => e.Amount);
            return new ApiResponse<string>(200,
                $"Released ?{total:F2} across {pending.Count} order(s) to Available");
        }
    }
}