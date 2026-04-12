using Homiee.Application.DTOs;
using Homiee.Application.DTOs.Auth;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }
        [HttpPost("register/customer")]
        public async Task<ActionResult> RegisterCustomer([FromBody] UserRegisterDto dto)
        {
            var result = await _authService.RegisterCustomer(dto);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("register/seller")]
        public async Task<ActionResult> RegisterSeller([FromBody] RegisterSellerDto dto)
        {
            var result = await _authService.RegisterSeller(dto);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("register/delivery")]
        public async Task<ActionResult> RegisterDelivery([FromBody] RegisterDeliveryDto dto)
        {
            var result = await _authService.RegisterDelivery(dto);
            return StatusCode(result.StatusCode, result);
        }
        [HttpPost("verify-email")]
        public async Task<ActionResult> VerifyEmail([FromBody] VerifyOtpDto verifyotpdto)
        {


            var result = await _authService.VerifyOtp(verifyotpdto);
            return StatusCode(result.StatusCode, result);
        }
        [HttpPost("resend-otp")]
        public async Task<ActionResult> ResendOtp([FromBody] ResendOtpDto resendotpdto)
        {
            var result = await _authService.ResendOtp(resendotpdto.Email);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginDto loginDto)
        {
            var result = await _authService.Login(loginDto);
            return StatusCode(result.StatusCode, result);
        }
        [Authorize]
        [HttpGet("me")]

        public async Task<ActionResult> GetCurrentUser()
        {
            var result = await _authService.GetUserProfile(User);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
        {
            var result = await _authService.RefreshToken(dto.RefreshToken);
            return StatusCode(result.StatusCode, result);
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<ActionResult> Logout()
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();

            if (string.IsNullOrEmpty(authHeader))
                return Unauthorized();

            var accessToken = authHeader.Replace("Bearer ", "");

            var result = await _authService.Logout(userId, accessToken);
            return StatusCode(result.StatusCode, result);
        }
    }
}
