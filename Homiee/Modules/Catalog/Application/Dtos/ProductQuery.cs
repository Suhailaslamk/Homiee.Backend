namespace Homiee.Modules.Catalog.Application.Dtos
{
    public class ProductQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        public string? Search { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }

        public string? SortBy { get; set; }
        public bool Desc { get; set; }
        public int? CategoryId { get; set; }
        public bool? InStockOnly { get; set; }       // ← NEW
        public double? MinRating { get; set; }
    }
}
