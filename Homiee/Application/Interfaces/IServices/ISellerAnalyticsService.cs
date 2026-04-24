using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ISellerAnalyticsService
    {
        /// <summary>Full analytics snapshot for the seller dashboard.</summary>
        Task<ApiResponse<SellerAnalyticsDto>> GetAnalytics(int sellerId, SellerAnalyticsQueryDto query);

        /// <summary>KPI headline numbers only — lightweight polling endpoint.</summary>
        Task<ApiResponse<SellerKpiDto>> GetKpis(int sellerId);
    }
}