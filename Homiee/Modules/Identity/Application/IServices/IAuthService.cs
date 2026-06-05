using Homiee.Modules.Identity.Domain.Entities;
using Homiee.Shared.Domain.Enums;
using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Shared.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
namespace Homiee.Modules.Identity.Application.IServices
{
    public interface IAuthService
    {
        
        //public Task<ApiResponse<string>> UserRegister(UserRegisterDto userRegisterDto);
        public  Task<ApiResponse<string>> RegisterSeller(RegisterSellerDto dto);
        //private Task<(User user, ApiResponse<string>? error)> CreateBaseUser(
        //    string fullName, string email, string password);
        Task<ApiResponse<string>> RegisterCustomer(UserRegisterDto dto);
        public Task<ApiResponse<string>> RegisterDelivery(RegisterDeliveryDto dto);
        public Task<ApiResponse<object>> Login(LoginDto loginDto);
        public Task<ApiResponse<string>> VerifyOtp(VerifyOtpDto verifyotpdto);
        public Task<ApiResponse<string>> Logout(int userId,string accessToken);
        public  Task<ApiResponse<string>> ResendOtp(string email);
        Task<ApiResponse<object>> RefreshToken(string refreshToken);
    }
}


