using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Entities;

namespace Homiee.Application.Services
{
   
        public class ReviewService : IReviewService
        {
            private readonly IReviewRepository _repo;
            private readonly IProductRepository _productRepo;

            public ReviewService(IReviewRepository repo, IProductRepository productRepo)
            {
                _repo = repo;
                _productRepo = productRepo;
            }

            public async Task<ApiResponse<string>> AddReview(int userId, int productId, CreateReviewDto dto)
            {
                var product = await _productRepo.GetByIdAsync(productId);

                if (product == null)
                    return new ApiResponse<string>(404, "Product not found");

                if (dto.Rating < 1 || dto.Rating > 5)
                    return new ApiResponse<string>(400, "Invalid rating");

                var exists = await _repo.Exists(userId, productId);

                if (exists)
                    return new ApiResponse<string>(400, "Already reviewed");

                var review = new Review(productId, userId, dto.Rating, dto.Comment);

                await _repo.AddAsync(review);
                await _repo.SaveChangesAsync();

                return new ApiResponse<string>(200, "Review added");
            }

            public async Task<ApiResponse<List<ReviewDto>>> GetReviews(int productId)
            {
                var reviews = await _repo.GetByProductId(productId);

                var result = reviews.Select(r => new ReviewDto
                {
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                }).ToList();

                return new ApiResponse<List<ReviewDto>>(200, "Success", result);
            }
        }
    }
