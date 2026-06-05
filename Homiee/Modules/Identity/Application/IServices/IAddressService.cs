using Homiee.Modules.Identity.Domain.Entities;
using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Identity.Application.IServices
{
    public interface IAddressService
    {
        Task<ApiResponse<List<GetAddressDto>>> GetAddresses(int userId);
        Task<ApiResponse<string>> Create(int userId, CreateAddressDto dto);
        Task<ApiResponse<string>> Update(int userId, int id, UpdateAddressDto dto);
        Task<ApiResponse<string>> Delete(int userId, int id);

    }
}
