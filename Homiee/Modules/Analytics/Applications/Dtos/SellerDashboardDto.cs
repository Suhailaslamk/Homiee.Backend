namespace Homiee.Modules.Analytics.Applications.Dtos
{
    public class SellerDashboardDto
    {
        public int TotalProducts { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public int LowStockProducts { get; set; }
    }
}
