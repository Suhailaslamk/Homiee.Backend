using Homiee.Modules.Orders.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Orders.Application.IServices
{
    public interface ISellerEarningService
    {
        Task CreateEarningForOrder(int sellerId, int orderId, decimal amount);

        Task<ApiResponse<SellerEarningsDto>> GetEarnings(int userId, int page = 1, int pageSize = 20);

        /// <summary>Admin: move all Pending earnings older than holdDays to Available.</summary>
        Task<ApiResponse<string>> ReleaseEarnings(int sellerId, int holdDays = 7);

        /// <summary>Admin: pay out all Available earnings for a seller.</summary>
        Task<ApiResponse<string>> ProcessPayout(int sellerId);
    }
}