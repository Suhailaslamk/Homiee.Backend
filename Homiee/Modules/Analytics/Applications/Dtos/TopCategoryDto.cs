namespace Homiee.Modules.Analytics.Applications.Dtos
{
    public class TopCategoryDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}
