using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Homiee.Application.Interfaces.IServices;
using Homiee.Application.DTOs;

namespace Homiee.Presentation.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminSellerController : ControllerBase
    {
        private readonly IAdminSellerService _adminSellerService;
        private readonly ISellerEarningService _earningService;

        public AdminSellerController(IAdminSellerService adminSellerService, ISellerEarningService earningService)
        {
            _adminSellerService = adminSellerService;
            _earningService = earningService;
        }

        [HttpGet("sellers")]
        public async Task<ActionResult> GetSellers([FromQuery] SellerQueryParamsDto queryParams)
        {
            var result = await _adminSellerService.GetSellers(queryParams);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("sellers/{userId}")]
        public async Task<ActionResult> GetSeller(int userId)
        {
            var result = await _adminSellerService.GetSellerDetails(userId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("sellers/{userId}/approve")]
        public async Task<ActionResult> Approve(int userId)
        {
            var result = await _adminSellerService.ApproveSeller(userId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("sellers/{userId}/reject")]
        public async Task<ActionResult> Reject(int userId, [FromBody] string reason)
        {
            var result = await _adminSellerService.RejectSeller(userId, reason);
            return StatusCode(result.StatusCode, result);
        }
        [HttpGet("sellers/rejected")]
        public async Task<ActionResult> GetRejected()
        {
            var query = new SellerQueryParamsDto
            {
                Status = "Rejected",
                Page = 1,
                PageSize = 10
            };

            var result = await _adminSellerService.GetSellers(query);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("suspend/{userId}")]
        public async Task<IActionResult> Suspend(int userId, [FromBody] string reason)
        {
            return Ok(await _adminSellerService.SuspendSeller(userId, reason));
        }
        [HttpPost("sellers/{sellerId}/release-earnings")]
        public async Task<IActionResult> ReleaseEarnings(
            int sellerId,
            [FromQuery] int holdDays = 7)
        {
            var result = await _earningService.ReleaseEarnings(sellerId, holdDays);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("sellers/{sellerId}/payout")]
        public async Task<IActionResult> ProcessPayout(int sellerId)
        {
            var result = await _earningService.ProcessPayout(sellerId);
            return StatusCode(result.StatusCode, result);
        }
    }
}
