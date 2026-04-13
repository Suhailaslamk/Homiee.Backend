using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Homiee.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [ApiController]
    [Route("api/profile")]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _service;

        public ProfileController(IProfileService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var userIdClaim = User.FindFirst("userId");

            if (userIdClaim == null)
                return Unauthorized("UserId claim missing");

            var userId = int.Parse(userIdClaim.Value);
            return Ok(await _service.GetProfile(userId));
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateProfileDto dto)
        {
            var userId = int.Parse(User.FindFirst("userId")!.Value);

            var roleValue = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(roleValue))
                return Unauthorized();

            var role = Enum.Parse<UserRole>(roleValue);

            var result = await _service.UpdateProfile(userId, dto, role);

            return StatusCode(result.StatusCode, result);
        }
    }
}
