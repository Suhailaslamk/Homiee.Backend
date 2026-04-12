using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ISellerProfileService
    {
        Task<ApiResponse<object>> GetSellerProfile(int userId);
    }
}
