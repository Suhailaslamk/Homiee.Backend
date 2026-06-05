namespace Homiee.Shared.Applications.Options
{
    public class CacheSettings
    {
        public int CategoryTtlMinutes { get; set; } = 30;
        public int ProductDetailTtlMinutes { get; set; } = 10;
        public int SellerDetailTtlMinutes { get; set; } = 15;
        public int StoreTtlMinutes { get; set; } = 5;
        public int AdminAnalyticsTtlMinutes { get; set; } = 5;
        public int AdminKpiTtlMinutes { get; set; } = 2;
        public int SellerAnalyticsTtlMinutes { get; set; } = 5;
        public int SellerKpiTtlMinutes { get; set; } = 2;
        public int RecommendationTtlMinutes { get; set; } = 10;
        public int CartTtlMinutes { get; set; } = 5;
        public int WishlistTtlMinutes { get; set; } = 10;
        public int RevokedTokenTtlMinutes { get; set; } = 15;
    }
}
