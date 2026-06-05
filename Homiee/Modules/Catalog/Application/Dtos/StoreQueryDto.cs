namespace Homiee.Modules.Catalog.Application.Dtos
{
    public class StoreQueryDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Search { get; set; }
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public double? RadiusKm { get; set; } = 10;
        public string? SortBy { get; set; }  

        public int? CategoryId { get; set; }

        public double? MinRating { get; set; }

        
    }
}
