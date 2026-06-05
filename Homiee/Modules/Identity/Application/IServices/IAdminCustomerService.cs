using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Orders.Application.Dtos;
using Homiee.Shared.Common;
namespace Homiee.Modules.Identity.Application.IServices
{
    public interface IAdminCustomerService
    {
        Task<ApiResponse<PagedResult<CustomerDto>>> GetCustomers(CustomerQueryDto query);

        Task<ApiResponse<CustomerDetailsDto>> GetCustomerById(int id);

        Task<ApiResponse<PagedResult<OrderDetailsDto>>>
    GetCustomerOrders(int customerId, int page = 1, int pageSize = 10);

        Task<ApiResponse<string>> BlockCustomer(int id, string? reason);

        Task<ApiResponse<string>> UnblockCustomer(int id);

        Task<ApiResponse<string>> DeleteCustomer(int id);
    }
}
