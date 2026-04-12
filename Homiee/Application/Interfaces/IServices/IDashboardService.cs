using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IDashboardService
    {
        Task<ApiResponse<AdminDashboardDto>> GetAdminDashboard();
        Task<ApiResponse<SellerDashboardDto>> GetSellerDashboard(int sellerId);
    }
}