namespace Homiee.Modules.Catalog.Application.Dtos
{
    public class NearbyQueryDto
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        /// <summary>Search radius in kilometres. Defaults to 10 km.</summary>
        public double RadiusKm { get; set; } = 10;

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        // Product-only filters (ignored for stores endpoint)
        public int? CategoryId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public bool? InStockOnly { get; set; }
        public double? MinRating { get; set; }

        /// <summary>
        /// Sort options: distance (default), rating, price_asc, price_desc, newest, popular
        /// </summary>
        public string? SortBy { get; set; }
    }
}
