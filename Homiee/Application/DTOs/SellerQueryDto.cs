namespace Homiee.Application.DTOs
{
    public class SellerQueryDto
    {
        public int? CategoryId { get; set; }
        public string? Search { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
