using Dapper;
using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Homiee.Application.Options;
using Homiee.Common;
using Homiee.Domain.Enums;
using Homiee.Infrastructure.Data;
using Microsoft.Extensions.Options;

namespace Homiee.Application.Services
{
    public class SellerAnalyticsService : ISellerAnalyticsService
    {
        private readonly DapperContext _context;
        private readonly ICacheService _cache;
        private readonly CacheSettings _cfg;
        private readonly ILogger<SellerAnalyticsService> _logger;

        public SellerAnalyticsService(DapperContext context, ICacheService cache, IOptions<CacheSettings> cfg, ILogger<SellerAnalyticsService> logger)
        {
            _context = context;
            _cache = cache;
            _cfg = cfg.Value;
            _logger = logger;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Full snapshot
        // ─────────────────────────────────────────────────────────────────────────
        public async Task<ApiResponse<SellerAnalyticsDto>> GetAnalytics(
            int sellerId, SellerAnalyticsQueryDto query)
        {
            _logger.LogInformation("Fetching analytics for Seller #{SellerId} (Days: {Days}, TopN: {TopN})", sellerId, query.Days, query.TopN);

            query.Days = Math.Clamp(query.Days, 1, 365);
            query.TopN = Math.Clamp(query.TopN, 1, 50);

            var key = $"seller:analytics:{sellerId}:{query.Days}:{query.TopN}";
            var cached = await _cache.GetAsync<SellerAnalyticsDto>(key);
            if (cached is not null)
            {
                _logger.LogInformation("Analytics cache hit for Seller #{SellerId}", sellerId);
                return new ApiResponse<SellerAnalyticsDto>(200, "Success", cached);
            }

            _logger.LogInformation("Analytics cache miss for Seller #{SellerId}. Executing Dapper queries.", sellerId);
            using var conn = _context.CreateConnection();
            conn.Open();

            var dto = new SellerAnalyticsDto
            {
                Kpis = await FetchKpisAsync(conn, sellerId),
                RevenueLast30Days = await FetchRevenueLast30DaysAsync(conn, sellerId, query.Days),
                OrdersByStatus = await FetchOrdersByStatusAsync(conn, sellerId),
                TopProducts = await FetchTopProductsAsync(conn, sellerId, query.TopN),
                LowStockProducts = await FetchLowStockAsync(conn, sellerId),
                RecentOrders = await FetchRecentOrdersAsync(conn, sellerId),
                RecentReviews = await FetchRecentReviewsAsync(conn, sellerId),
                Earnings = await FetchEarningsSummaryAsync(conn, sellerId),
                RatingSummary = await FetchRatingSummaryAsync(conn, sellerId)
            };




            //var dto = new SellerAnalyticsDto
            //{
            //    Kpis = await kpiTask,
            //    RevenueLast30Days = await revenueTask,
            //    OrdersByStatus = await statusTask,
            //    TopProducts = await topProductsTask,
            //    LowStockProducts = await lowStockTask,
            //    RecentOrders = await recentOrdersTask,
            //    RecentReviews = await recentReviews,
            //    Earnings = await earningsTask,
            //    RatingSummary = await ratingTask
            //};
            //dto.Kpis = await FetchKpisAsync(connection);
            //dto.RevenueLast30Days = await FetchRevenueLast30DaysAsync(connection, query.Days);
            //dto.OrdersByStatus = await FetchOrdersByStatusAsync(connection);
            //dto.TopSellers = await FetchTopSellersAsync(connection, query.TopN);
            //dto.TopProducts = await FetchTopProductsAsync(connection, query.TopN);
            //dto.TopCategories = await FetchTopCategoriesAsync(connection, query.TopN);
            //dto.NewUsersLast30Days = await FetchNewUsersByDayAsync(connection, query.Days);
            //dto.PaymentBreakdown = await FetchPaymentBreakdownAsync(connection);
            //dto.SellerStatusBreakdown = await FetchSellerStatusBreakdownAsync(connection);
            //dto.EarningsSummary = await FetchEarningsSummaryAsync(connection);


            await _cache.SetAsync(key, dto,
        TimeSpan.FromMinutes(_cfg.SellerAnalyticsTtlMinutes));

            return new ApiResponse<SellerAnalyticsDto>(200, "Success", dto);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // KPIs only
        // ─────────────────────────────────────────────────────────────────────────
        public async Task<ApiResponse<SellerKpiDto>> GetKpis(int sellerId)
        {
            var key = $"seller:kpis:{sellerId}";
            var cached = await _cache.GetAsync<SellerKpiDto>(key);
            if (cached is not null)
                return new ApiResponse<SellerKpiDto>(200, "Success", cached);


            using var conn = _context.CreateConnection();

            conn.Open();

            var kpis = await FetchKpisAsync(conn, sellerId);

            await _cache.SetAsync(key, kpis,
        TimeSpan.FromMinutes(_cfg.SellerKpiTtlMinutes));

            return new ApiResponse<SellerKpiDto>(200, "Success", kpis);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────────────────────────────────────

        private static async Task<SellerKpiDto> FetchKpisAsync(
            System.Data.IDbConnection conn, int sellerId)
        {
            const string sql = @"
DECLARE @Today          DATE  = CAST(GETUTCDATE() AS DATE);
DECLARE @MonthStart     DATE  = DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(GETUTCDATE()), 1);
DECLARE @PrevMonthStart DATE  = DATEADD(MONTH, -1, @MonthStart);
DECLARE @Delivered      INT   = @DeliveredStatus;
DECLARE @Pending        INT   = @PendingStatus;
DECLARE @Cancelled      INT   = @CancelledStatus;
DECLARE @SellerId       INT   = @SellerIdParam;

SELECT
    -- Products
    (SELECT COUNT(*) FROM Products WHERE SellerId = @SellerId AND IsDeleted = 0)                    AS TotalProducts,
    (SELECT COUNT(*) FROM Products WHERE SellerId = @SellerId AND IsDeleted = 0 AND Stock > 0)      AS ActiveProducts,
    (SELECT COUNT(*) FROM Products WHERE SellerId = @SellerId AND IsDeleted = 0 AND Stock = 0)      AS OutOfStockProducts,
    (SELECT COUNT(*) FROM Products WHERE SellerId = @SellerId AND IsDeleted = 0 AND Stock < 5 AND Stock > 0) AS LowStockProducts,

    -- Orders
    (SELECT COUNT(*) FROM Orders WHERE SellerId = @SellerId)                                        AS TotalOrders,
    (SELECT COUNT(*) FROM Orders WHERE SellerId = @SellerId AND CAST(CreatedAt AS DATE) = @Today)   AS OrdersToday,
    (SELECT COUNT(*) FROM Orders WHERE SellerId = @SellerId AND Status = @Pending)                  AS PendingOrders,
    (SELECT COUNT(*) FROM Orders WHERE SellerId = @SellerId AND Status = @Delivered)                AS DeliveredOrders,
    (SELECT COUNT(*) FROM Orders WHERE SellerId = @SellerId AND Status = @Cancelled)                AS CancelledOrders,

    -- Revenue
    (SELECT ISNULL(SUM(TotalAmount),0) FROM Orders WHERE SellerId = @SellerId AND Status = @Delivered)         AS TotalRevenue,
    (SELECT ISNULL(SUM(TotalAmount),0) FROM Orders
        WHERE SellerId = @SellerId AND Status = @Delivered
          AND CAST(CreatedAt AS DATE) = @Today)                                                     AS RevenueToday,
    (SELECT ISNULL(SUM(TotalAmount),0) FROM Orders
        WHERE SellerId = @SellerId AND Status = @Delivered
          AND CreatedAt >= @MonthStart)                                                             AS RevenueThisMonth,
    (SELECT ISNULL(SUM(TotalAmount),0) FROM Orders
        WHERE SellerId = @SellerId AND Status = @Delivered
          AND CreatedAt >= @PrevMonthStart AND CreatedAt < @MonthStart)                            AS RevenuePrevMonth,

    -- Ratings
    (SELECT ISNULL(AverageRating, 0) FROM Sellers WHERE Id = @SellerId)                            AS AverageRating,
    (SELECT ISNULL(ReviewCount,   0) FROM Sellers WHERE Id = @SellerId)                            AS TotalReviews,

    -- Earnings
    (SELECT ISNULL(SUM(Amount),0) FROM SellerEarnings WHERE SellerId = @SellerId AND Status = @EarningPending)    AS PendingEarnings,
(SELECT ISNULL(SUM(Amount),0) FROM SellerEarnings WHERE SellerId = @SellerId AND Status = @EarningAvailable)  AS AvailableEarnings,
(SELECT ISNULL(SUM(Amount),0) FROM SellerEarnings WHERE SellerId = @SellerId AND Status = @EarningPaid)       AS TotalPaidOut
";

            var raw = await conn.QueryFirstOrDefaultAsync<dynamic>(sql, new
            {
                SellerIdParam = sellerId,
                DeliveredStatus = (int)OrderStatus.Delivered,
                PendingStatus = (int)OrderStatus.Pending,
                CancelledStatus = (int)OrderStatus.Cancelled,
                EarningPending = (int)EarningStatus.Pending,
                EarningAvailable = (int)EarningStatus.Available,
                EarningPaid = (int)EarningStatus.Paid
            });

            if (raw == null) return new SellerKpiDto();

            decimal thisMonth = (decimal)(raw.RevenueThisMonth ?? 0);
            decimal prevMonth = (decimal)(raw.RevenuePrevMonth ?? 0);
            decimal growth = prevMonth > 0
                ? Math.Round((thisMonth - prevMonth) / prevMonth * 100, 1)
                : (thisMonth > 0 ? 100m : 0m);

            return new SellerKpiDto
            {
                TotalProducts = (int)(raw.TotalProducts ?? 0),
                ActiveProducts = (int)(raw.ActiveProducts ?? 0),
                OutOfStockProducts = (int)(raw.OutOfStockProducts ?? 0),
                LowStockProducts = (int)(raw.LowStockProducts ?? 0),
                TotalOrders = (int)(raw.TotalOrders ?? 0),
                OrdersToday = (int)(raw.OrdersToday ?? 0),
                PendingOrders = (int)(raw.PendingOrders ?? 0),
                DeliveredOrders = (int)(raw.DeliveredOrders ?? 0),
                CancelledOrders = (int)(raw.CancelledOrders ?? 0),
                TotalRevenue = (decimal)(raw.TotalRevenue ?? 0),
                RevenueToday = (decimal)(raw.RevenueToday ?? 0),
                RevenueThisMonth = thisMonth,
                RevenuePrevMonth = prevMonth,
                RevenueGrowthPercent = growth,
                AverageRating = (double)(raw.AverageRating ?? 0),
                TotalReviews = (int)(raw.TotalReviews ?? 0),
                PendingEarnings = (decimal)(raw.PendingEarnings ?? 0),
                AvailableEarnings = (decimal)(raw.AvailableEarnings ?? 0),
                TotalPaidOut = (decimal)(raw.TotalPaidOut ?? 0)
            };
        }

        private static async Task<List<SellerRevenueByDayDto>> FetchRevenueLast30DaysAsync(
            System.Data.IDbConnection conn, int sellerId, int days)
        {
            const string sql = @"
WITH DateSeries AS (
    SELECT CAST(DATEADD(DAY, -(number), CAST(GETUTCDATE() AS DATE)) AS DATE) AS [Date]
    FROM master.dbo.spt_values
    WHERE type = 'P' AND number BETWEEN 0 AND @Days - 1
)
SELECT
    CONVERT(VARCHAR(10), d.[Date], 120)     AS [Date],
    ISNULL(SUM(o.TotalAmount), 0)           AS Revenue,
    ISNULL(COUNT(o.Id), 0)                  AS [Orders]
FROM DateSeries d
LEFT JOIN Orders o
    ON CAST(o.CreatedAt AS DATE) = d.[Date]
   AND o.SellerId  = @SellerId
   AND o.Status    = @DeliveredStatus
GROUP BY d.[Date]
ORDER BY d.[Date];
";
            var rows = await conn.QueryAsync<SellerRevenueByDayDto>(sql, new
            {
                SellerId = sellerId,
                Days = days,
                DeliveredStatus = (int)OrderStatus.Delivered
            });
            return rows.ToList();
        }

        private static async Task<List<SellerOrdersByStatusDto>> FetchOrdersByStatusAsync(
            System.Data.IDbConnection conn, int sellerId)
        {
            const string sql = @"
SELECT
    CASE Status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Processing'
        WHEN 2 THEN 'Placed'
        WHEN 3 THEN 'Shipped'
        WHEN 4 THEN 'Delivered'
        WHEN 5 THEN 'Cancelled'
        WHEN 6 THEN 'Accepted'
        WHEN 7 THEN 'Rejected'
        ELSE 'Unknown'
    END AS Status,
    COUNT(*) AS [Count]
FROM Orders
WHERE SellerId = @SellerId
GROUP BY Status
ORDER BY Status;
";
            var rows = await conn.QueryAsync<SellerOrdersByStatusDto>(sql, new { SellerId = sellerId });
            return rows.ToList();
        }

        private static async Task<List<SellerTopProductDto>> FetchTopProductsAsync(
            System.Data.IDbConnection conn, int sellerId, int topN)
        {
            const string sql = @"
SELECT TOP (@TopN)
    p.Id                                        AS ProductId,
    p.Name,
    ISNULL(SUM(oi.Quantity), 0)                 AS TotalSold,
    ISNULL(SUM(oi.Price * oi.Quantity), 0)      AS TotalRevenue,
    ISNULL(p.AverageRating, 0)                  AS AverageRating
FROM Products p
JOIN OrderItems oi ON oi.ProductId = p.Id
JOIN Orders     o  ON o.Id = oi.OrderId
                   AND o.SellerId = @SellerId
                   AND o.Status   = @DeliveredStatus
WHERE p.IsDeleted = 0
GROUP BY p.Id, p.Name, p.AverageRating
ORDER BY TotalSold DESC;
";
            var rows = await conn.QueryAsync<SellerTopProductDto>(sql, new
            {
                SellerId = sellerId,
                TopN = topN,
                DeliveredStatus = (int)OrderStatus.Delivered
            });
            return rows.ToList();
        }

        private static async Task<List<SellerLowStockDto>> FetchLowStockAsync(
            System.Data.IDbConnection conn, int sellerId)
        {
            const string sql = @"
SELECT Id AS ProductId, Name, Stock
FROM Products
WHERE SellerId  = @SellerId
  AND IsDeleted = 0
  AND Stock     < 5
ORDER BY Stock ASC;
";
            var rows = await conn.QueryAsync<SellerLowStockDto>(sql, new { SellerId = sellerId });
            return rows.ToList();
        }

        private static async Task<List<SellerRecentOrderDto>> FetchRecentOrdersAsync(
            System.Data.IDbConnection conn, int sellerId)
        {
            const string sql = @"
SELECT TOP 10
    o.Id             AS OrderId,
    u.Name           AS CustomerName,
    o.TotalAmount,
    CASE o.Status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Processing'
        WHEN 2 THEN 'Placed'
        WHEN 3 THEN 'Shipped'
        WHEN 4 THEN 'Delivered'
        WHEN 5 THEN 'Cancelled'
        WHEN 6 THEN 'Accepted'
        WHEN 7 THEN 'Rejected'
        ELSE 'Unknown'
    END              AS Status,
    o.CreatedAt
FROM Orders o
JOIN Users  u ON u.Id = o.UserId
WHERE o.SellerId = @SellerId
ORDER BY o.CreatedAt DESC;
";
            var rows = await conn.QueryAsync<SellerRecentOrderDto>(sql, new { SellerId = sellerId });
            return rows.ToList();
        }

        private static async Task<List<SellerRecentReviewDto>> FetchRecentReviewsAsync(
            System.Data.IDbConnection conn, int sellerId)
        {
            const string sql = @"
SELECT TOP 5
    u.Name      AS CustomerName,
    sr.Rating,
    sr.Comment,
    sr.CreatedAt
FROM SellerReviews sr
JOIN Users u ON u.Id = sr.UserId
WHERE sr.SellerId = @SellerId
ORDER BY sr.CreatedAt DESC;
";
            var rows = await conn.QueryAsync<SellerRecentReviewDto>(sql, new { SellerId = sellerId });
            return rows.ToList();
        }

        private static async Task<SellerEarningsSummaryDto> FetchEarningsSummaryAsync(
            System.Data.IDbConnection conn, int sellerId)
        {
            const string sql = @"
SELECT
    ISNULL(SUM(CASE WHEN Status = 0 THEN Amount ELSE 0 END), 0) AS PendingEarnings,
    ISNULL(SUM(CASE WHEN Status = 1 THEN Amount ELSE 0 END), 0) AS AvailableEarnings,
    ISNULL(SUM(CASE WHEN Status = 2 THEN Amount ELSE 0 END), 0) AS TotalPaidOut
FROM SellerEarnings
WHERE SellerId = @SellerId;
";
            var result = await conn.QueryFirstOrDefaultAsync<SellerEarningsSummaryDto>(
                sql, new { SellerId = sellerId });
            return result ?? new SellerEarningsSummaryDto();
        }

        private static async Task<SellerRatingSummaryDto> FetchRatingSummaryAsync(
            System.Data.IDbConnection conn, int sellerId)
        {
            const string sql = @"
SELECT
    ISNULL(AVG(CAST(Rating AS FLOAT)), 0)                           AS AverageRating,
    COUNT(*)                                                         AS TotalReviews,
    SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END)                    AS FiveStar,
    SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END)                    AS FourStar,
    SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END)                    AS ThreeStar,
    SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END)                    AS TwoStar,
    SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END)                    AS OneStar
FROM SellerReviews
WHERE SellerId = @SellerId;
";
            var result = await conn.QueryFirstOrDefaultAsync<SellerRatingSummaryDto>(
                sql, new { SellerId = sellerId });
            return result ?? new SellerRatingSummaryDto();
        }
    }
}