using Homiee.Common;
using Homiee.Application.DTOs;
namespace Homiee.Application.Interfaces.IServices
{
    public interface IAdminCustomerService
    {
        Task<ApiResponse<PagedResult<CustomerDto>>> GetCustomers(CustomerQueryDto query);

        Task<ApiResponse<CustomerDetailsDto>> GetCustomerById(int id);

        Task<ApiResponse<List<OrderDetailsDto>>> GetCustomerOrders(int customerId);

        Task<ApiResponse<string>> BlockCustomer(int id, string? reason);

        Task<ApiResponse<string>> UnblockCustomer(int id);

        Task<ApiResponse<string>> DeleteCustomer(int id);
    }
}
