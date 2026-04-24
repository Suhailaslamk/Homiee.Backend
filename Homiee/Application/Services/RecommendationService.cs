using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Application.Options;
using Homiee.Domain.Entities;
using Microsoft.Extensions.Options;

namespace Homiee.Application.Services
{
    public sealed class RecommendationService : IRecommendationService
    {
        private readonly IProductRepository _productRepository;
        private readonly RecommendationWeightsOptions _weights;
        private readonly ICacheService _cache;
        private readonly CacheSettings _cfg;

        public RecommendationService(
            IProductRepository productRepository,
            IOptions<RecommendationWeightsOptions> weights,
            ICacheService cache,
            IOptions<CacheSettings> cfg)
        {
            _productRepository = productRepository;
            _weights = weights.Value;
            _cache = cache;
            _cfg = cfg.Value;
        }

        public async Task<IEnumerable<RecomendationResultDto>> GetRecommendationsAsync(
            int productId,
            int topN = 10,
            CancellationToken cancellationToken = default)
        {

            var key = $"recommendations:{productId}:{topN}";
            var cached = await _cache.GetAsync<List<RecomendationResultDto>>(key);
            if (cached is not null) return cached;

            // Fetch the source product — fail fast if it doesn't exist
            var source = await _productRepository.GetByIdAsync(productId);
            if (source is null)
                throw new KeyNotFoundException($"Product {productId} not found.");

            // Fetch candidate pool: same category OR same seller
            var candidates = await _productRepository.GetCandidatesForRecommendationAsync(
                categoryId: source.CategoryId,
                sellerId: source.SellerId,
                cancellationToken: cancellationToken);

            // Price band boundaries (+/- 20%)
            var priceLow = source.Price * 0.80m;
            var priceHigh = source.Price * 1.20m;

            // Normalisation — avoid division by zero
            var maxRating = 5.0;
            var maxReviewCount = candidates.Any() ? candidates.Max(p => (double)p.ReviewCount) : 1.0;

            var results = candidates
                .Where(p => p.Id != productId) // always exclude the viewed product
                .Select(p => new
                {
                    Product = p,
                    Score = ComputeScore(p, source, priceLow, priceHigh, maxRating, maxReviewCount)
                })
                .OrderByDescending(x => x.Score)
                .Take(topN)
                .Select(x => new RecomendationResultDto
                {
                    Id = x.Product.Id,
                    Name = x.Product.Name,
                    Price = x.Product.Price,
                    CategoryId = x.Product.CategoryId,
                    SellerId = x.Product.SellerId,
                    AverageRating = x.Product.AverageRating,
                    ReviewCount = x.Product.ReviewCount,
                    ThumbnailUrl = x.Product.Images
                                    .FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                                  ?? x.Product.Images.FirstOrDefault()?.ImageUrl,
                    Score = x.Score
                })
                .ToList();


            await _cache.SetAsync(key, results,
       TimeSpan.FromMinutes(_cfg.RecommendationTtlMinutes));


            return results;
        }

        // ── Scoring ────────────────────────────────────────────────────────────
        // Every factor is normalised to [0, 1] before applying its weight,
        // so weights are directly comparable percentages.
        // Weights are injected from appsettings — no magic numbers here.

        private double ComputeScore(
            Product candidate,
            Product source,
            decimal priceLow,
            decimal priceHigh,
            double maxRating,
            double maxReviewCount)
        {
            double score = 0;

            // 1. Category match — binary: same category is the strongest signal
            if (candidate.CategoryId == source.CategoryId)
                score += _weights.CategoryMatch;

            // 2. Price similarity — full score inside +/-20% band,
            //    linear decay beyond it (never goes below 0)
            double priceFactor = (candidate.Price >= priceLow && candidate.Price <= priceHigh)
                ? 1.0
                : Math.Max(0.0, 1.0 - (double)Math.Abs(candidate.Price - source.Price) / (double)source.Price);
            score += _weights.PriceSimilarity * priceFactor;

            // 3. Same seller — customers browsing a store expect seller cross-sells
            if (candidate.SellerId == source.SellerId)
                score += _weights.SameSeller;

            // 4. Average rating — normalised against the 5-star ceiling
            double ratingFactor = maxRating > 0 ? candidate.AverageRating / maxRating : 0;
            score += _weights.Rating * ratingFactor;

            // 5. Review count — social proof; normalised against pool maximum
            double reviewFactor = maxReviewCount > 0 ? candidate.ReviewCount / maxReviewCount : 0;
            score += _weights.ReviewCount * reviewFactor;

            return score;
        }
    }
}