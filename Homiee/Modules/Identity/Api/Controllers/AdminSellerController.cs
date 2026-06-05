using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Identity.Application.IServices;
using Homiee.Modules.Orders.Application.IServices;
using Homiee.Modules.Identity.Application.Dtos;


namespace Homiee.Modules.Identity.Api.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminSellerController : ControllerBase
    {
        private readonly IAdminSellerService _adminSellerService;
        private readonly ISellerEarningService _earningService;
        private readonly ILogger<AdminSellerController> _logger;

        public AdminSellerController(IAdminSellerService adminSellerService, ISellerEarningService earningService, ILogger<AdminSellerController> logger)
        {
            _adminSellerService = adminSellerService;
            _earningService = earningService;
            _logger = logger;
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
            _logger.LogInformation("Admin request to APPROVE Seller for User #{UserId}", userId);
            var result = await _adminSellerService.ApproveSeller(userId);
            _logger.LogInformation("Admin APPROVE result for User #{UserId}: {StatusCode}", userId, result.StatusCode);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("sellers/{userId}/reject")]
        public async Task<ActionResult> Reject(int userId, [FromBody] AdminActionDto dto)
        {
            _logger.LogInformation("Admin request to REJECT Seller for User #{UserId}. Reason: {Reason}", userId, dto.Reason);
            var result = await _adminSellerService.RejectSeller(userId, dto.Reason);
            _logger.LogInformation("Admin REJECT result for User #{UserId}: {StatusCode}", userId, result.StatusCode);
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
        public async Task<IActionResult> Suspend(int userId, [FromBody] AdminActionDto dto)
        {
            var result = await _adminSellerService.SuspendSeller(userId, dto.Reason);
            return StatusCode(result.StatusCode, result);
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
