namespace Homiee.Modules.Analytics.Applications.Dtos
{
    // ── Full snapshot ────────────────────────────────────────────────────────────
    public class SellerAnalyticsDto
    {
        public SellerKpiDto Kpis { get; set; } = new();
        public List<SellerRevenueByDayDto> RevenueLast30Days { get; set; } = new();
        public List<SellerOrdersByStatusDto> OrdersByStatus { get; set; } = new();
        public List<SellerTopProductDto> TopProducts { get; set; } = new();
        public List<SellerLowStockDto> LowStockProducts { get; set; } = new();
        public List<SellerRecentOrderDto> RecentOrders { get; set; } = new();
        public List<SellerRecentReviewDto> RecentReviews { get; set; } = new();
        public SellerEarningsSummaryDto Earnings { get; set; } = new();
        public SellerRatingSummaryDto RatingSummary { get; set; } = new();
    }

    // ── KPI headline numbers ─────────────────────────────────────────────────────
    public class SellerKpiDto
    {
        public int TotalProducts { get; set; }
        public int ActiveProducts { get; set; }
        public int OutOfStockProducts { get; set; }
        public int LowStockProducts { get; set; }           // stock < 5
        public int TotalOrders { get; set; }
        public int OrdersToday { get; set; }
        public int PendingOrders { get; set; }
        public int DeliveredOrders { get; set; }
        public int CancelledOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal RevenueToday { get; set; }
        public decimal RevenueThisMonth { get; set; }
        public decimal RevenuePrevMonth { get; set; }
        public decimal RevenueGrowthPercent { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public decimal PendingEarnings { get; set; }        // EarningStatus.Pending
        public decimal AvailableEarnings { get; set; }      // EarningStatus.Available
        public decimal TotalPaidOut { get; set; }           // EarningStatus.Paid
    }

    // ── Time-series ──────────────────────────────────────────────────────────────
    public class SellerRevenueByDayDto
    {
        public string Date { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int Orders { get; set; }
    }

    // ── Order distribution ────────────────────────────────────────────────────────
    public class SellerOrdersByStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    // ── Leaderboard ──────────────────────────────────────────────────────────────
    public class SellerTopProductDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalSold { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AverageRating { get; set; }
    }

    // ── Inventory alerts ─────────────────────────────────────────────────────────
    public class SellerLowStockDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Stock { get; set; }
    }

    // ── Recent activity ───────────────────────────────────────────────────────────
    public class SellerRecentOrderDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class SellerRecentReviewDto
    {
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // ── Earnings summary ─────────────────────────────────────────────────────────
    public class SellerEarningsSummaryDto
    {
        public decimal PendingEarnings { get; set; }
        public decimal AvailableEarnings { get; set; }
        public decimal TotalPaidOut { get; set; }
    }

    // ── Rating breakdown ─────────────────────────────────────────────────────────
    public class SellerRatingSummaryDto
    {
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public int FiveStar { get; set; }
        public int FourStar { get; set; }
        public int ThreeStar { get; set; }
        public int TwoStar { get; set; }
        public int OneStar { get; set; }
    }

    // ── Query params ─────────────────────────────────────────────────────────────
    public class SellerAnalyticsQueryDto
    {
        /// <summary>Days to look back for time-series (default 30)</summary>
        public int Days { get; set; } = 30;

        /// <summary>How many top products to return (default 5)</summary>
        public int TopN { get; set; } = 5;
    }
}