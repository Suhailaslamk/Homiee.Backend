//using Homiee.Application.DTOs;
//using Homiee.Application.Interfaces.IRepository;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Common;
//using Homiee.Domain.Entities;

//namespace Homiee.Application.Services
//{

//        public class ReviewService : IReviewService
//        {
//            private readonly IReviewRepository _repo;
//            private readonly IProductRepository _productRepo;

//            public ReviewService(IReviewRepository repo, IProductRepository productRepo)
//            {
//                _repo = repo;
//                _productRepo = productRepo;
//            }

//        public async Task<ApiResponse<string>> AddReview(int userId, int productId, CreateReviewDto dto)
//        {
//            var product = await _productRepo.GetByIdAsync(productId);
//            if (product == null)
//                return new ApiResponse<string>(404, "Product not found");

//            if (dto.Rating < 1 || dto.Rating > 5)
//                return new ApiResponse<string>(400, "Rating must be between 1 and 5");

//            var exists = await _repo.Exists(userId, productId);
//            if (exists)
//                return new ApiResponse<string>(400, "You have already reviewed this product");

//            var review = new Review(productId, userId, dto.Rating, dto.Comment);
//            await _repo.AddAsync(review);
//            await _repo.SaveChangesAsync();

//            // Recalculate average rating
//            var allReviews = await _repo.GetByProductId(productId);
//            var avg = allReviews.Average(r => r.Rating);
//            product.UpdateRating(avg, allReviews.Count);
//            await _productRepo.SaveChangesAsync();

//            return new ApiResponse<string>(200, "Review added");
//        }

//        public async Task<ApiResponse<List<ReviewDto>>> GetReviews(int productId)
//            {
//                var reviews = await _repo.GetByProductId(productId);

//                var result = reviews.Select(r => new ReviewDto
//                {
//                    Rating = r.Rating,
//                    Comment = r.Comment,
//                    CreatedAt = r.CreatedAt
//                }).ToList();

//                return new ApiResponse<List<ReviewDto>>(200, "Success", result);
//            }
//        }
//    }




using Microsoft.EntityFrameworkCore;
using Homiee.Modules.Reviews.Domain.Entities;
using Homiee.Shared.Common;
using Homiee.Modules.Reviews.Application.Dtos;
using Homiee.Modules.Catalog.Application.IRepository;
using Homiee.Modules.Reviews.Application.IRepositories;
using Homiee.Modules.Reviews.Application.IServices;
using Homiee.Shared.Applications.IData;

namespace Homiee.Modules.Reviews.Application.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _repo;
        private readonly IProductRepository _productRepo;
        private readonly IApplicationDbContext _dbContext;

        public ReviewService(
            IReviewRepository repo,
            IProductRepository productRepo,
            IApplicationDbContext dbContext)
        {
            _repo = repo;
            _productRepo = productRepo;
            _dbContext = dbContext;
        }

        public async Task<ApiResponse<string>> AddReview(int userId, int productId, CreateReviewDto dto)
        {
            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null)
                return new ApiResponse<string>(404, "Product not found");

            if (dto.Rating < 1 || dto.Rating > 5)
                return new ApiResponse<string>(400, "Rating must be between 1 and 5");

            var exists = await _repo.Exists(userId, productId);
            if (exists)
                return new ApiResponse<string>(400, "You have already reviewed this product");

            var review = new Review(productId, userId, dto.Rating, dto.Comment);
            await _repo.AddAsync(review);
            await _repo.SaveChangesAsync();

            // Recalculate product's average rating
            var allReviews = await _repo.GetByProductId(productId);
            var avg = allReviews.Average(r => (double)r.Rating);
            product.UpdateRating(avg, allReviews.Count);
            await _productRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Review added successfully");
        }

        public async Task<ApiResponse<List<ReviewDto>>> GetReviews(int productId)
        {
            var reviews = await _dbContext.Set<Review>()
                .Where(r => r.ProductId == productId)
                .Include(r => r.Product)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDto
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

            return new ApiResponse<List<ReviewDto>>(200, "Success", reviews);
        }
    }
}