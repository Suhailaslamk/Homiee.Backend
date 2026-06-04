using Dapper;
using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IData;
using Homiee.Application.Interfaces.IServices;
using Homiee.Application.Options;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Microsoft.Extensions.Options;

namespace Homiee.Application.Services
{
    public class AdminAnalyticsService : IAdminAnalyticsService
    {
        private readonly IDbConnectionFactory _context;
        private readonly ICacheService _cache;
        private readonly CacheSettings _cfg;

        public AdminAnalyticsService(IDbConnectionFactory context, ICacheService cache, IOptions<CacheSettings> cfg)
        {
            _context = context;
            _cache = cache;
            _cfg = cfg.Value; 
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Full analytics snapshot
        // ─────────────────────────────────────────────────────────────────────────
        public async Task<ApiResponse<AdminAnalyticsDto>> GetAnalytics(AdminAnalyticsQueryDto query)
        {
            query.Days = Math.Clamp(query.Days, 1, 365);
            query.TopN = Math.Clamp(query.TopN, 1, 50);

            var key = $"admin:analytics:{query.Days}:{query.TopN}";
            var cached = await _cache.GetAsync<AdminAnalyticsDto>(key);
            if (cached is not null)
                return new ApiResponse<AdminAnalyticsDto>(200, "Success", cached);

            using var connection = _context.CreateConnection();
            connection.Open();
            var dto = new AdminAnalyticsDto();

            dto.Kpis = await FetchKpisAsync(connection);
            dto.RevenueLast30Days = await FetchRevenueLast30DaysAsync(connection, query.Days);
            dto.OrdersByStatus = await FetchOrdersByStatusAsync(connection);
            dto.TopSellers = await FetchTopSellersAsync(connection, query.TopN);
            dto.TopProducts = await FetchTopProductsAsync(connection, query.TopN);
            dto.TopCategories = await FetchTopCategoriesAsync(connection, query.TopN);
            dto.NewUsersLast30Days = await FetchNewUsersByDayAsync(connection, query.Days);
            dto.SellerStatusBreakdown = await FetchSellerStatusBreakdownAsync(connection);
            dto.EarningsSummary = await FetchEarningsSummaryAsync(connection);

            await _cache.SetAsync(key, dto,
        TimeSpan.FromMinutes(_cfg.AdminAnalyticsTtlMinutes));

            return new ApiResponse<AdminAnalyticsDto>(200, "Success", dto);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // KPIs only
        // ─────────────────────────────────────────────────────────────────────────
        public async Task<ApiResponse<AdminKpiDto>> GetKpis()
        {
            const string key = "admin:kpis";
            var cached = await _cache.GetAsync<AdminKpiDto>(key);
            if (cached is not null)
                return new ApiResponse<AdminKpiDto>(200, "Success", cached);

            using var connection = _context.CreateConnection();

            connection.Open();
            var kpis = await FetchKpisAsync(connection);

            await _cache.SetAsync(key, kpis,
        TimeSpan.FromMinutes(_cfg.AdminKpiTtlMinutes));

            return new ApiResponse<AdminKpiDto>(200, "Success", kpis);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────────────────────────────────────

        private static async Task<AdminKpiDto> FetchKpisAsync(System.Data.IDbConnection conn)
        {
            const string sql = @"
DECLARE @Today          DATE        = CAST(GETUTCDATE() AS DATE);
DECLARE @MonthStart     DATE        = DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(GETUTCDATE()), 1);
DECLARE @PrevMonthStart DATE        = DATEADD(MONTH, -1, @MonthStart);
DECLARE @Delivered      INT         = @DeliveredStatus;
DECLARE @Pending        INT         = @PendingApproval;

SELECT
    (SELECT COUNT(*) FROM Users WHERE IsDeleted = 0)                                        AS TotalUsers,
    (SELECT COUNT(*) FROM Sellers)                                                           AS TotalSellers,
    (SELECT COUNT(*) FROM Users WHERE IsDeleted = 0 AND Role = @CustomerRole) AS TotalCustomers,                 
    (SELECT COUNT(*) FROM Products WHERE IsDeleted = 0)                                      AS TotalProducts,
    (SELECT COUNT(*) FROM Orders)                                                            AS TotalOrders,
    (SELECT COUNT(*) FROM Orders WHERE CAST(CreatedAt AS DATE) = @Today)                    AS OrdersToday,
    (SELECT ISNULL(SUM(TotalAmount),0) FROM Orders WHERE Status = @Delivered)               AS TotalRevenue,
    (SELECT ISNULL(SUM(TotalAmount),0) FROM Orders
       WHERE Status = @Delivered AND CAST(CreatedAt AS DATE) = @Today)                      AS RevenueToday,
    (SELECT ISNULL(SUM(TotalAmount),0) FROM Orders
       WHERE Status = @Delivered AND CreatedAt >= @MonthStart)                              AS RevenueThisMonth,
    (SELECT ISNULL(SUM(TotalAmount),0) FROM Orders
       WHERE Status = @Delivered
         AND CreatedAt >= @PrevMonthStart AND CreatedAt < @MonthStart)                      AS RevenuePrevMonth,
    (SELECT COUNT(*) FROM Sellers WHERE Status = @Pending)                                  AS PendingSellerApprovals,
    (SELECT COUNT(*) FROM Sellers WHERE Status = @ApprovedStatus)                           AS ActiveSellers,
    (SELECT ISNULL(SUM(Amount),0) FROM SellerEarnings WHERE Status = 0 /* Pending */)       AS PlatformPendingPayouts
";

            //var raw = await conn.QueryFirstOrDefaultAsync<dynamic>(sql, new
            //{
            //    DeliveredStatus = (int)OrderStatus.Delivered,
            //    PendingApproval = 0,
            //    ApprovedStatus = 1,
            //    CustomerRole = 0   // UserRole.User = 0 (your "customers")
            //});

            var raw = await conn.QueryFirstOrDefaultAsync<dynamic>(sql, new
            {
                DeliveredStatus = (int)OrderStatus.Delivered,
                PendingApproval = (int)ApprovalStatus.Submitted,
                ApprovedStatus = (int)ApprovalStatus.Approved,
                CustomerRole = (int)UserRole.User
            });

            if (raw == null) return new AdminKpiDto();

            decimal thisMonth = (decimal)(raw.RevenueThisMonth ?? 0);
            decimal prevMonth = (decimal)(raw.RevenuePrevMonth ?? 0);
            decimal growth = prevMonth > 0
                ? Math.Round((thisMonth - prevMonth) / prevMonth * 100, 1)
                : (thisMonth > 0 ? 100m : 0m);

            return new AdminKpiDto
            {
                TotalUsers = (int)(raw.TotalUsers ?? 0),
                TotalSellers = (int)(raw.TotalSellers ?? 0),
                TotalCustomers = (int)(raw.TotalCustomers ?? 0),
                TotalProducts = (int)(raw.TotalProducts ?? 0),
                TotalOrders = (int)(raw.TotalOrders ?? 0),
                OrdersToday = (int)(raw.OrdersToday ?? 0),
                TotalRevenue = (decimal)(raw.TotalRevenue ?? 0),
                RevenueToday = (decimal)(raw.RevenueToday ?? 0),
                RevenueThisMonth = thisMonth,
                RevenuePrevMonth = prevMonth,
                RevenueGrowthPercent = growth,
                PendingSellerApprovals = (int)(raw.PendingSellerApprovals ?? 0),
                ActiveSellers = (int)(raw.ActiveSellers ?? 0),
                PlatformPendingPayouts = (decimal)(raw.PlatformPendingPayouts ?? 0)
            };
        }

        private static async Task<List<RevenueByDayDto>> FetchRevenueLast30DaysAsync(
            System.Data.IDbConnection conn, int days)
        {
            const string sql = @"
WITH DateSeries AS (
    SELECT CAST(DATEADD(DAY, -(number), CAST(GETUTCDATE() AS DATE)) AS DATE) AS [Date]
    FROM master.dbo.spt_values
    WHERE type = 'P' AND number BETWEEN 0 AND @Days - 1
)
SELECT
    CONVERT(VARCHAR(10), d.[Date], 120)            AS [Date],
    ISNULL(SUM(o.TotalAmount), 0)                  AS Revenue,
    ISNULL(COUNT(o.Id), 0)                         AS [Orders]
FROM DateSeries d
LEFT JOIN Orders o
    ON CAST(o.CreatedAt AS DATE) = d.[Date]
   AND o.Status = @DeliveredStatus
GROUP BY d.[Date]
ORDER BY d.[Date];
";
            var rows = await conn.QueryAsync<RevenueByDayDto>(sql, new
            {
                Days = days,
                DeliveredStatus = (int)OrderStatus.Delivered
            });

            return rows.ToList();
        }

        private static async Task<List<OrdersByStatusDto>> FetchOrdersByStatusAsync(
            System.Data.IDbConnection conn)
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
GROUP BY Status
ORDER BY Status;
";
            var rows = await conn.QueryAsync<OrdersByStatusDto>(sql);
            return rows.ToList();
        }

        private static async Task<List<TopSellerDto>> FetchTopSellersAsync(
            System.Data.IDbConnection conn, int topN)
        {
            const string sql = @"
SELECT TOP (@TopN)
    s.Id                          AS SellerId,
    s.BusinessName,
    ISNULL(SUM(o.TotalAmount), 0) AS TotalRevenue,
    COUNT(o.Id)                   AS TotalOrders,
    ISNULL(s.AverageRating, 0)    AS AverageRating
FROM Sellers s
LEFT JOIN Orders o
    ON o.SellerId = s.Id AND o.Status = @DeliveredStatus
GROUP BY s.Id, s.BusinessName, s.AverageRating
ORDER BY TotalRevenue DESC;
";
            var rows = await conn.QueryAsync<TopSellerDto>(sql, new
            {
                TopN = topN,
                DeliveredStatus = (int)OrderStatus.Delivered
            });

            return rows.ToList();
        }

        private static async Task<List<TopProductDto>> FetchTopProductsAsync(
            System.Data.IDbConnection conn, int topN)
        {
            const string sql = @"
SELECT TOP (@TopN)
    p.Id                               AS ProductId,
    p.Name,
    s.BusinessName                     AS SellerName,
    ISNULL(SUM(oi.Quantity), 0)        AS TotalSold,
    ISNULL(SUM(oi.Price * oi.Quantity),0) AS TotalRevenue
FROM Products p
JOIN OrderItems oi  ON oi.ProductId = p.Id
JOIN Orders     o   ON o.Id = oi.OrderId AND o.Status = @DeliveredStatus
JOIN Sellers    s   ON s.Id = p.SellerId
WHERE p.IsDeleted = 0
GROUP BY p.Id, p.Name, s.BusinessName
ORDER BY TotalSold DESC;
";
            var rows = await conn.QueryAsync<TopProductDto>(sql, new
            {
                TopN = topN,
                DeliveredStatus = (int)OrderStatus.Delivered
            });

            return rows.ToList();
        }

        private static async Task<List<TopCategoryDto>> FetchTopCategoriesAsync(
            System.Data.IDbConnection conn, int topN)
        {
            const string sql = @"
SELECT TOP (@TopN)
    c.Id                                          AS CategoryId,
    c.Name,
    COUNT(DISTINCT o.Id)                          AS TotalOrders,
    ISNULL(SUM(oi.Price * oi.Quantity), 0)        AS TotalRevenue
FROM Categories c
JOIN Products  p  ON p.CategoryId = c.Id AND p.IsDeleted = 0
JOIN OrderItems oi ON oi.ProductId = p.Id
JOIN Orders     o  ON o.Id = oi.OrderId AND o.Status = @DeliveredStatus
GROUP BY c.Id, c.Name
ORDER BY TotalRevenue DESC;
";
            var rows = await conn.QueryAsync<TopCategoryDto>(sql, new
            {
                TopN = topN,
                DeliveredStatus = (int)OrderStatus.Delivered
            });

            return rows.ToList();
        }

        private static async Task<List<NewUsersByDayDto>> FetchNewUsersByDayAsync(
            System.Data.IDbConnection conn, int days)
        {
            const string sql = @"
WITH DateSeries AS (
    SELECT CAST(DATEADD(DAY, -(number), CAST(GETUTCDATE() AS DATE)) AS DATE) AS [Date]
    FROM master.dbo.spt_values
    WHERE type = 'P' AND number BETWEEN 0 AND @Days - 1
)
SELECT
    CONVERT(VARCHAR(10), d.[Date], 120) AS [Date],
  ISNULL(SUM(CASE WHEN u.Role = @CustomerRole THEN 1 ELSE 0 END), 0) AS Customers,
ISNULL(SUM(CASE WHEN u.Role = @SellerRole   THEN 1 ELSE 0 END), 0) AS Sellers
FROM DateSeries d
LEFT JOIN Users u ON CAST(u.CreatedOn AS DATE) = d.[Date] AND u.IsDeleted = 0
GROUP BY d.[Date]
ORDER BY d.[Date];
";
            var rows = await conn.QueryAsync<NewUsersByDayDto>(sql, new
            {
                Days = days,
                CustomerRole = (int)UserRole.User,
                SellerRole = (int)UserRole.Seller
            });
            return rows.ToList();
        }



        private static async Task<SellerStatusBreakdownDto> FetchSellerStatusBreakdownAsync(
            System.Data.IDbConnection conn)
        {
            const string sql = @"
SELECT
   SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) AS Pending,    -- Submitted
SUM(CASE WHEN Status = 2 THEN 1 ELSE 0 END) AS Approved,
SUM(CASE WHEN Status = 3 THEN 1 ELSE 0 END) AS Rejected,
SUM(CASE WHEN Status = 4 THEN 1 ELSE 0 END) AS Suspended
FROM Sellers;
";
            var result = await conn.QueryFirstOrDefaultAsync<SellerStatusBreakdownDto>(sql);
            return result ?? new SellerStatusBreakdownDto();
        }

        private static async Task<AdminEarningsSummaryDto> FetchEarningsSummaryAsync(
            System.Data.IDbConnection conn)
        {
            const string sql = @"
SELECT
    ISNULL(SUM(CASE WHEN Status = 0 THEN Amount ELSE 0 END), 0)  AS TotalPendingPayouts,
    ISNULL(SUM(CASE WHEN Status = 1 THEN Amount ELSE 0 END), 0)  AS TotalAvailablePayouts,
    ISNULL(SUM(CASE WHEN Status = 2 THEN Amount ELSE 0 END), 0)  AS TotalPaidOut,
    COUNT(DISTINCT CASE WHEN Status IN (0,1) THEN SellerId END)   AS SellersWithPendingPayout
FROM SellerEarnings;
";
            var result = await conn.QueryFirstOrDefaultAsync<AdminEarningsSummaryDto>(sql);
            return result ?? new AdminEarningsSummaryDto();
        }
    }
}
