using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Homiee.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [Route("api/customer/orders")]
    [ApiController]
    [Authorize(Roles = "User")]
    public class CustomerOrderController : ControllerBase
    {
        private readonly ICustomerOrderService _orderService;

        public CustomerOrderController(
            ICustomerOrderService orderService
            )
        {
            _orderService = orderService;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id))
                throw new UnauthorizedAccessException("Invalid token");
            return id;
        }

        [HttpPost("checkout/cod")]
        public async Task<IActionResult> CheckoutCod([FromBody] CheckoutFromCartDto dto)
        {
            var result = await _orderService.PlaceCodOrderFromCart(GetUserId(), dto.AddressId, dto.RequestedDeliveryDate);
            return StatusCode(result.StatusCode, result);
        }

        

        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var result = await _orderService.GetMyOrders(GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var result = await _orderService.GetOrderById(GetUserId(), id);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var result = await _orderService.CancelOrder(GetUserId(), id);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("{id}/status-history")]
        public async Task<IActionResult> GetStatusHistory(int id)
        {
            var result = await _orderService.GetOrderStatusHistory(GetUserId(), id);
            return StatusCode(result.StatusCode, result);
        }
    }
}