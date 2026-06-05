namespace Homiee.Modules.Orders.Application.Dtos
{
    public class AdminOrderQueryDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Status { get; set; }
        public string? Search { get; set; }   // ← ADD: filter by order id or user
        public string? SortBy { get; set; }   // ← ADD: "amount", "date"
        public bool Desc { get; set; } = true;
    }
}
