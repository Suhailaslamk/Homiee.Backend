namespace Homiee.Modules.Catalog.Application.Dtos
{
    public class AdminProductQueryDto
    {
        public string? Search { get; set; }
        public int? CategoryId { get; set; }
        public string? Status { get; set; } // Draft, Submitted, Approved, Rejected
        public string? SortBy { get; set; } // price, createdAt
        public bool Desc { get; set; } = false;

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
