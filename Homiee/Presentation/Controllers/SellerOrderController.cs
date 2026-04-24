//using Homiee.Application.Interfaces.IServices;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Homiee.Application.DTOs;


//namespace Homiee.Presentation.Controllers
//{
//    [Route("api/seller/orders")]
//    [ApiController]
//    [Authorize(Roles = "Seller")]
//    public class SellerOrderController : ControllerBase
//    {
//        private readonly ISellerOrderService _service;

//        public SellerOrderController(ISellerOrderService service)
//        {
//            _service = service;
//        }

//        private int GetUserId()
//        {
//            return int.Parse(User.FindFirst("userId")!.Value);
//        }

//        [HttpGet]
//        public async Task<IActionResult> GetOrders([FromQuery] OrderQueryDto query)
//        {
//            var result = await _service.GetOrders(GetUserId(), query);
//            return StatusCode(result.StatusCode, result);
//        }
//        [HttpGet("order/{id}")]
//        public async Task<IActionResult> GetOrder(int id)
//        {
//            int userId = int.Parse(User.FindFirst("userId")!.Value);     

//            var result = await _service.GetOrderById(id, userId);
//            return StatusCode(result.StatusCode, result);
//        }
//        [HttpPatch("{id}/status")]
//        public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusDto dto)
//        {
//            var result = await _service.UpdateStatus(id, GetUserId(), dto.Status);
//            return StatusCode(result.StatusCode, result);
//        }
//    }
//}




using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Homiee.Application.DTOs;

namespace Homiee.Presentation.Controllers
{
    [Route("api/seller/orders")]
    [ApiController]
    [Authorize(Roles = "Seller")]
    public class SellerOrderController : ControllerBase
    {
        private readonly ISellerOrderService _service;

        public SellerOrderController(ISellerOrderService service)
        {
            _service = service;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                throw new UnauthorizedAccessException("Invalid or missing token");

            if (!int.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("Invalid userId claim");

            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] OrderQueryDto query)
        {
            var result = await _service.GetOrders(GetUserId(), query);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("order/{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var result = await _service.GetOrderById(id, GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusDto dto)
        {
            var result = await _service.UpdateStatus(id, GetUserId(), dto.Status);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("{id}/tracking")]
        public async Task<IActionResult> GetTracking(int id)
        {
            var result = await _service.GetOrderTracking(id, GetUserId());
            return StatusCode(result.StatusCode, result);
        }
    }
}