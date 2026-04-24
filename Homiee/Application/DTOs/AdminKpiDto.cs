namespace Homiee.Application.DTOs
{
    public class AdminKpiDto
    {
        public int TotalUsers { get; set; }
        public int TotalSellers { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalProducts { get; set; }
        public int TotalOrders { get; set; }
        public int OrdersToday { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal RevenueToday { get; set; }
        public decimal RevenueThisMonth { get; set; }
        public decimal RevenuePrevMonth { get; set; }
        public decimal RevenueGrowthPercent { get; set; }
        public int PendingSellerApprovals { get; set; }
        public int ActiveSellers { get; set; }
        public decimal PlatformPendingPayouts { get; set; }
    }
}
