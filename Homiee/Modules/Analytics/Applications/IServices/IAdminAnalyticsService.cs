
using Homiee.Modules.Analytics.Applications.Dtos;
using Homiee.Shared.Common;


namespace Homiee.Modules.Analytics.Applications.IServices
    {
        public interface IAdminAnalyticsService
        {
            
            Task<ApiResponse<AdminAnalyticsDto>> GetAnalytics(AdminAnalyticsQueryDto query);

            
            Task<ApiResponse<AdminKpiDto>> GetKpis();
        }
    }

