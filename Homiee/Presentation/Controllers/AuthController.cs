using Homiee.Application.DTOs;
using Homiee.Application.DTOs.Auth;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Homiee.Presentation.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
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
            _logger.LogInformation("Login request received for Email: {Email}", loginDto?.Email);
            var result = await _authService.Login(loginDto);
            _logger.LogInformation("Login response for {Email}: {StatusCode}", loginDto?.Email, result.StatusCode);
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
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || userId <= 0)
                return Unauthorized("Invalid token claims");

            var authHeader = Request.Headers["Authorization"].FirstOrDefault();

            if (string.IsNullOrEmpty(authHeader))
                return Unauthorized();

            var accessToken = authHeader.Replace("Bearer ", "");

            var result = await _authService.Logout(userId, accessToken);
            return StatusCode(result.StatusCode, result);
        }
        
    }
}
