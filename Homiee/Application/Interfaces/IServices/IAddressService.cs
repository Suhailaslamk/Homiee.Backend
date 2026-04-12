using Homiee.Application.DTOs;
using Homiee.Common;
using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IAddressService
    {
        Task<ApiResponse<List<GetAddressDto>>> GetAddresses(int userId);
        Task<ApiResponse<string>> Create(int userId, CreateAddressDto dto);
        Task<ApiResponse<string>> Update(int userId, int id, UpdateAddressDto dto);
        Task<ApiResponse<string>> Delete(int userId, int id);

    }
}
