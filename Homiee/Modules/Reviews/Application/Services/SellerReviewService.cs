using Microsoft.EntityFrameworkCore;
using Homiee.Modules.Reviews.Domain.Entities;
using Homiee.Shared.Common;
using Homiee.Modules.Reviews.Application.Dtos;
using Homiee.Modules.Reviews.Application.IServices;
using Homiee.Shared.Applications.IData;

namespace Homiee.Modules.Reviews.Application.Services
{
    public class SellerReviewService : ISellerReviewService
    {
        private readonly IApplicationDbContext _dbContext;

        public SellerReviewService(IApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ApiResponse<string>> AddSellerReview(
            int userId, int sellerId, CreateSellerReviewDto dto)
        {
            // Must have a delivered order from this seller
            var hasOrder = await _dbContext.Orders
                .AnyAsync(o => o.UserId == userId
                            && o.SellerId == sellerId
                            && o.Id == dto.OrderId
                            && o.Status == Homiee.Shared.Domain.Enums.OrderStatus.Delivered);

            if (!hasOrder)
                return new ApiResponse<string>(400,
                    "You can only review a seller after a delivered order");

            // One review per order
            var alreadyReviewed = await _dbContext.Set<SellerReview>()
                .AnyAsync(r => r.UserId == userId
                            && r.SellerId == sellerId
                            && r.OrderId == dto.OrderId);

            if (alreadyReviewed)
                return new ApiResponse<string>(400, "You have already reviewed this seller for this order");

            var review = new SellerReview(sellerId, userId, dto.OrderId, dto.Rating, dto.Comment);
            await _dbContext.Set<SellerReview>().AddAsync(review);
            await _dbContext.SaveChangesAsync();

            // Recalculate seller's average rating
            var seller = await _dbContext.Sellers.FindAsync(sellerId);
            if (seller != null)
            {
                var allRatings = await _dbContext.Set<SellerReview>()
                    .Where(r => r.SellerId == sellerId)
                    .Select(r => r.Rating)
                    .ToListAsync();

                seller.UpdateRating(allRatings.Average(r => (double)r), allRatings.Count);
                await _dbContext.SaveChangesAsync();
            }

            return new ApiResponse<string>(200, "Review added successfully");
        }

        public async Task<ApiResponse<List<SellerReviewDto>>> GetSellerReviews(int sellerId)
        {
            var reviews = await _dbContext.Set<SellerReview>()
                .Where(r => r.SellerId == sellerId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new SellerReviewDto
                {
                    Rating = r.Rating,
                    Comment = r.Comment,
                    UserName = _dbContext.Users
                        .Where(u => u.Id == r.UserId)
                        .Select(u => u.Name)
                        .FirstOrDefault(),
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return new ApiResponse<List<SellerReviewDto>>(200, "Success", reviews);
        }
    }
}