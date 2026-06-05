using Homiee.Modules.Analytics.Applications.Dtos;
using Homiee.Modules.Analytics.Applications.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Modules.Analytics.Api.Controllers
{
    
    [ApiController]
    [Route("api/admin/analytics")]
    [Authorize(Roles = "Admin")]
    public class AdminAnalyticsController : ControllerBase
    {
        private readonly IAdminAnalyticsService _service;

        public AdminAnalyticsController(IAdminAnalyticsService service)
        {
            _service = service;
        }

        
        [HttpGet]
        public async Task<IActionResult> GetAnalytics([FromQuery] AdminAnalyticsQueryDto query)
        {
            var result = await _service.GetAnalytics(query);
            return StatusCode(result.StatusCode, result);
        }

        
        [HttpGet("kpis")]
        public async Task<IActionResult> GetKpis()
        {
            var result = await _service.GetKpis();
            return StatusCode(result.StatusCode, result);
        }
    }
}