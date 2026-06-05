using Homiee.Modules.Analytics.Applications.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Analytics.Applications.IServices
{
    public interface ISellerAnalyticsService
    {
        
        Task<ApiResponse<SellerAnalyticsDto>> GetAnalytics(int sellerId, SellerAnalyticsQueryDto query);

        
        Task<ApiResponse<SellerKpiDto>> GetKpis(int sellerId);
    }
}