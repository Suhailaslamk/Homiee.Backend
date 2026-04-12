using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Homiee.API.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var result = await _dashboardService.GetAdminDashboard();
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("seller")]
        [Authorize(Roles = "Seller")]
        public async Task<IActionResult> GetSellerDashboard()
        {
            var sellerId = int.Parse(User.FindFirst("userId")!.Value);

            var result = await _dashboardService.GetSellerDashboard(sellerId);
            return StatusCode(result.StatusCode, result);
        }
    }
}