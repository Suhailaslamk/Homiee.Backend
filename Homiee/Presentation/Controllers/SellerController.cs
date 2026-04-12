using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Homiee.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Homiee.Presentation.Controllers
{
    [Route("api/seller")]
    [ApiController]
    [Authorize(Roles = "Seller")]
    public class SellerController : ControllerBase
    {
        private readonly ISellerProfileService _profileService;
        private readonly ISellerOnboardingService _onboardingService;

        public SellerController(ISellerProfileService profileService,
       ISellerOnboardingService onboardingService)
        {
            _profileService = profileService;
            _onboardingService = onboardingService;
        }


        [HttpPost("complete-profile")]
        public async Task<ActionResult> CompleteProfile([FromForm] CompleteSellerDetailsDto dto)
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");

            var result = await _onboardingService.CompleteSellerDetails(userId, dto);
            return StatusCode(result.StatusCode, result);
        }
        [HttpPost("resubmit")]
        public async Task<ActionResult> Resubmit([FromForm] CompleteSellerDetailsDto dto)
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");

            var result = await _onboardingService.ResubmitSeller(userId, dto);

            return StatusCode(result.StatusCode, result);
        }


        [HttpGet("profile")]
        public async Task<ActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");

            var result = await _profileService.GetSellerProfile(userId);
            return StatusCode(result.StatusCode, result);
        }
    }
}