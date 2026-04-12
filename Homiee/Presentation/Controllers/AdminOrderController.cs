using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Homiee.Application.DTOs;

namespace Homiee.Presentation.Controllers
{
    [Route("api/admin/orders")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminOrderController : ControllerBase
    {
        private readonly IAdminOrderService _service;

        public AdminOrderController(IAdminOrderService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] AdminOrderQueryDto query)
        {
            var result = await _service.GetOrders(query);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusDto dto)
        {
            var result = await _service.UpdateStatus(id, dto.Status);
            return StatusCode(result.StatusCode, result);
        }
    }
}
