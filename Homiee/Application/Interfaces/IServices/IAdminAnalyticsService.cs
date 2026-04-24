
   using global::Homiee.Application.DTOs;
    using global::Homiee.Common;
    using Homiee.Application.DTOs;
    using Homiee.Common;

    namespace Homiee.Application.Interfaces.IServices
    {
        public interface IAdminAnalyticsService
        {
            /// <summary>Full analytics snapshot used by the admin dashboard.</summary>
            Task<ApiResponse<AdminAnalyticsDto>> GetAnalytics(AdminAnalyticsQueryDto query);

            /// <summary>KPI headline numbers only — for a lightweight polling endpoint.</summary>
            Task<ApiResponse<AdminKpiDto>> GetKpis();
        }
    }

