using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Application.Options;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Microsoft.Extensions.Options;

namespace Homiee.Application.Services
{
    public class WishlistService : IWishlistService
    {
        private readonly IWishlistRepository _wishlistRepo;
        private readonly IProductRepository _productRepo;
        private readonly ICacheService _cache;
        private readonly CacheSettings _cfg;
        private readonly IUserRepository _userRepo;

        public WishlistService(
            IWishlistRepository wishlistRepo,
            IProductRepository productRepo,
            ICacheService cache,
            IOptions<CacheSettings> cfg,
            IUserRepository userRepo)
        {
            _wishlistRepo = wishlistRepo;
            _productRepo = productRepo;
            _cache = cache;
            _cfg = cfg.Value;
            _userRepo = userRepo;
        }

        private string GetCacheKey(int userId)
            => $"wishlist:v1:user:{userId}";

        public async Task<ApiResponse<string>> AddToWishlist(int userId, int productId)
        {
            // Check existence
            var exists = await _wishlistRepo.ExistsAsync(userId, productId);
            if (exists)
                return new ApiResponse<string>(400, "Already in wishlist");

            // Validate product
            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null || product.IsDeleted)
                return new ApiResponse<string>(404, "Product not found");

            if (product.SellerId == userId)
                return new ApiResponse<string>(400, "You cannot add your own product to wishlist");

            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                return new ApiResponse<string>(404, "User not found");



            if (user.Role == UserRole.Admin)   
                return new ApiResponse<string>(400, "Admin cannot add products to wishlist");

            try
            {
                await _wishlistRepo.AddAsync(new Wishlist(userId, productId));
                await _wishlistRepo.SaveChangesAsync();
            }
            catch (Exception)
            {
                // Ideally check for unique constraint violation here
                return new ApiResponse<string>(500, "Failed to add wishlist item");
            }

            // Cache invalidation (fail-safe)
            try
            {
                await _cache.RemoveAsync(GetCacheKey(userId));
            }
            catch
            {
                // Log in real production
            }

            return new ApiResponse<string>(200, "Added to wishlist");
        }

        public async Task<ApiResponse<string>> RemoveFromWishlist(int userId, int productId)
        {
            var item = await _wishlistRepo.GetAsync(userId, productId);
            if (item == null)
                return new ApiResponse<string>(404, "Not in wishlist");

            await _wishlistRepo.RemoveAsync(item);
            await _wishlistRepo.SaveChangesAsync();

            try
            {
                await _cache.RemoveAsync(GetCacheKey(userId));
            }
            catch
            {
                // Log this
            }

            return new ApiResponse<string>(200, "Removed from wishlist");
        }

        public async Task<ApiResponse<List<WishlistItemDto>>> GetMyWishlist(int userId)
        {
            var cacheKey = GetCacheKey(userId);

            // Try cache
            var cached = await _cache.GetAsync<List<WishlistItemDto>>(cacheKey);
            if (cached != null)
                return new ApiResponse<List<WishlistItemDto>>(200, "Success", cached);

            // Fetch from DB
            var wishlistItems = await _wishlistRepo.GetByUserIdAsync(userId);

            // Projection (mapping)
            var result = wishlistItems
                .Where(w => w.Product != null && !w.Product.IsDeleted)
                .Select(w => new WishlistItemDto
                {
                    ProductId = w.ProductId,
                    ProductName = w.Product.Name,
                    Price = w.Product.Price,
                    AverageRating = w.Product.AverageRating,
                    IsAvailable = w.Product.Stock > 0,
                    ImageUrl = w.Product.Images
                        .Where(i => i.IsPrimary)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                })
                .ToList();

            // Set cache safely
            try
            {
                await _cache.SetAsync(
                    cacheKey,
                    result,
                    TimeSpan.FromMinutes(_cfg.WishlistTtlMinutes));
            }
            catch
            {
                // Logging needed in real app
            }

            return new ApiResponse<List<WishlistItemDto>>(200, "Success", result);
        }

        public async Task<ApiResponse<string>> ClearWishlist(int userId)
        {
            var items = await _wishlistRepo.GetByUserIdAsync(userId);

            if (items == null || !items.Any())
                return new ApiResponse<string>(200, "Wishlist already empty");

            await _wishlistRepo.RemoveRangeAsync(items);
            await _wishlistRepo.SaveChangesAsync();

            try
            {
                await _cache.RemoveAsync(GetCacheKey(userId));
            }
            catch
            {
                // Log this
            }

            return new ApiResponse<string>(200, "Wishlist cleared successfully");
        }
    }
}