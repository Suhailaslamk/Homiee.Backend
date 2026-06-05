//using Homiee.Application.DTOs;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Application.Services;
//using Homiee.Domain.Enums;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using System.Security.Claims;

//namespace Homiee.Presentation.Controllers
//{
//    [ApiController]
//    [Route("api/profile")]
//    public class ProfileController : ControllerBase
//    {
//        private readonly IProfileService _service;

//        public ProfileController(IProfileService service)
//        {
//            _service = service;
//        }

//        [HttpGet]
//        public async Task<IActionResult> Get()
//        {
//            var userIdClaim = User.FindFirst("userId");

//            if (userIdClaim == null)
//                return Unauthorized("UserId claim missing");

//            var userId = int.Parse(userIdClaim.Value);
//            return Ok(await _service.GetProfile(userId));
//        }

//        [Authorize]
//        [HttpPut]
//        public async Task<IActionResult> Update([FromForm] UpdateSellerProfileDto dto)
//        {
//            var userIdClaim = User.FindFirst("userId")?.Value;

//            if (!int.TryParse(userIdClaim, out var userId))
//                return Unauthorized(new { message = "Invalid token" });

//            var roleValue = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

//            if (!Enum.TryParse<UserRole>(roleValue, out var role))
//                return Unauthorized(new { message = "Invalid role" });

//            var result = await _service.UpdateUserProfile(userId, roleValue, dto);

//            return StatusCode(result.StatusCode, result);
//        }

//    }
//}












using Homiee.Shared.Domain.Enums;
using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Identity.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Homiee.Modules.Identity.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/profile")]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _service;

        public ProfileController(IProfileService service)
        {
            _service = service;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst("userId")?.Value;
            if (!int.TryParse(claim, out var userId))
                throw new UnauthorizedAccessException("Invalid token");

            return userId;
        }

        // ✅ GET PROFILE
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await _service.GetProfile(GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        // ✅ UPDATE BASIC USER PROFILE
        [HttpPut("user")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> UpdateUser([FromForm] UpdateUserprofileDto dto)
        {
            var result = await _service.UpdateUserProfile(GetUserId(), dto);
            return StatusCode(result.StatusCode, result);
        }

        // ✅ UPDATE SELLER PROFILE
        [HttpPut("seller")]
        [Authorize(Roles = "Seller")]
        public async Task<IActionResult> UpdateSeller([FromBody] UpdateSellerProfileDto dto)
        {
            var result = await _service.UpdateSellerProfile(GetUserId(), dto);
            return StatusCode(result.StatusCode, result);
        }
    }
}