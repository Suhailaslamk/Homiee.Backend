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

        public AdminSellerController(IAdminSellerService adminSellerService)
        {
            _adminSellerService = adminSellerService;
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
    }
}
