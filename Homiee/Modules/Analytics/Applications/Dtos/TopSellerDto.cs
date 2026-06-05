namespace Homiee.Modules.Analytics.Applications.Dtos
{
    public class TopSellerDto
    {
        public int SellerId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public double AverageRating { get; set; }
    }
}
