using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Orders.Application.Dtos;

namespace Homiee.Modules.Analytics.Applications.Dtos
{
    public class AdminAnalyticsDto
    {
        public AdminKpiDto Kpis { get; set; } = new();
        public List<RevenueByDayDto> RevenueLast30Days { get; set; } = new();
        public List<OrdersByStatusDto> OrdersByStatus { get; set; } = new();
        public List<TopSellerDto> TopSellers { get; set; } = new();
        public List<TopProductDto> TopProducts { get; set; } = new();
        public List<TopCategoryDto> TopCategories { get; set; } = new();
        public List<NewUsersByDayDto> NewUsersLast30Days { get; set; } = new();
        public SellerStatusBreakdownDto SellerStatusBreakdown { get; set; } = new();
        public AdminEarningsSummaryDto EarningsSummary { get; set; } = new();
    }
}
