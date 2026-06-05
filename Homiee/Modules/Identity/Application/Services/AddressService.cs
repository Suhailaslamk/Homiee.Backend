using FluentAssertions.Equivalency;
using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Identity.Application.IRepository;
using Homiee.Modules.Identity.Application.IServices;
using Homiee.Shared.Common;
using System.Numerics;
using System.Text.RegularExpressions;
using Homiee.Modules.Identity.Domain.Entities;
using static Homiee.Modules.Identity.Application.Services.AddressService;

namespace Homiee.Modules.Identity.Application.Services
{

    public class AddressService : IAddressService
    {
        private readonly IAddressRepository _repo;

        public AddressService(IAddressRepository repo)
        {
            _repo = repo;
        }

        public async Task<ApiResponse<List<GetAddressDto>>> GetAddresses(int userId)
        {
            var addresses = await _repo.GetByUserIdAsync(userId);

            var result = addresses.Select(a => new GetAddressDto
            {
                Id = a.Id,
                Line1 = a.Line1,
                City = a.City,
                State = a.State,
                Pincode = a.Pincode
            }).ToList();

            return new ApiResponse<List<GetAddressDto>>(200, "Success", result);
        }

        public async Task<ApiResponse<string>> Create(int userId, CreateAddressDto dto)
        {
            if (dto == null)
                return new ApiResponse<string>(400, "Invalid request");

            if (string.IsNullOrWhiteSpace(dto.FullName))
                return new ApiResponse<string>(400, "Full name is required");

            if (!Regex.IsMatch(dto.FullName, @"^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$"))
                return new ApiResponse<string>(400, "Invalid name format");

            if (string.IsNullOrWhiteSpace(dto.Phone))
                return new ApiResponse<string>(400, "Phone number is required");

            if (!Regex.IsMatch(dto.Phone, @"^[6-9]\d{9}$"))
                return new ApiResponse<string>(400, "Invalid phone number");

            if (string.IsNullOrWhiteSpace(dto.Line1) || dto.Line1.Length < 5)
                return new ApiResponse<string>(400, "Address line is too short");

            if (dto.Line1.Length > 200)
                return new ApiResponse<string>(400, "Address line too long");

            if (string.IsNullOrWhiteSpace(dto.City))
                return new ApiResponse<string>(400, "City is required");

            if (!Regex.IsMatch(dto.City, @"^[A-Za-z ]+$"))
                return new ApiResponse<string>(400, "Invalid city");

            if (string.IsNullOrWhiteSpace(dto.State))
                return new ApiResponse<string>(400, "State is required");

            if (!Regex.IsMatch(dto.State, @"^[A-Za-z ]+$"))
                return new ApiResponse<string>(400, "Invalid state");

            if (string.IsNullOrWhiteSpace(dto.Pincode))
                return new ApiResponse<string>(400, "Pincode is required");

            if (!Regex.IsMatch(dto.Pincode, @"^\d{6}$"))
                return new ApiResponse<string>(400, "Invalid pincode");

            var address = new Address(
                userId,
                dto.FullName.Trim(),
                dto.Phone,
                dto.Line1.Trim(),
                dto.City.Trim(),
                dto.State.Trim(),
                dto.Pincode
            );

            await _repo.AddAsync(address);
            await _repo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Address added");
        }
        public async Task<ApiResponse<string>> Update(int userId, int id, UpdateAddressDto dto)
        {
            if (dto == null)
                return new ApiResponse<string>(400, "Invalid request");

            var address = await _repo.GetByIdAsync(id);

            if (address == null || address.UserId != userId)
                return new ApiResponse<string>(404, "Not found");

            if (string.IsNullOrWhiteSpace(dto.Line1) || dto.Line1.Length < 5)
                return new ApiResponse<string>(400, "Address line is too short");

            if (dto.Line1.Length > 200)
                return new ApiResponse<string>(400, "Address line too long");

            if (string.IsNullOrWhiteSpace(dto.City))
                return new ApiResponse<string>(400, "City is required");

            if (!Regex.IsMatch(dto.City, @"^[A-Za-z ]+$"))
                return new ApiResponse<string>(400, "Invalid city");

            if (string.IsNullOrWhiteSpace(dto.State))
                return new ApiResponse<string>(400, "State is required");

            if (!Regex.IsMatch(dto.State, @"^[A-Za-z ]+$"))
                return new ApiResponse<string>(400, "Invalid state");

            if (string.IsNullOrWhiteSpace(dto.Pincode))
                return new ApiResponse<string>(400, "Pincode is required");

            if (!Regex.IsMatch(dto.Pincode, @"^\d{6}$"))
                return new ApiResponse<string>(400, "Invalid pincode");

            try
            {
                address.Update(
                    dto.FullName,
                    dto.Phone,
                    dto.Line1,
                    dto.City,
                    dto.State,
                    dto.Pincode
                );

                await _repo.SaveChangesAsync();

                return new ApiResponse<string>(200, "Updated");
            }
            catch (Exception ex)
            {
                return new ApiResponse<string>(400, "something went wrong",ex.Message);
            }
        }

        public async Task<ApiResponse<string>> Delete(int userId, int id)
        {
            var address = await _repo.GetByIdAsync(id);

            if (address == null || address.UserId != userId)
                return new ApiResponse<string>(404, "Not found");

            await _repo.DeleteAsync(address);
            await _repo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Deleted");
        }
    }
}
