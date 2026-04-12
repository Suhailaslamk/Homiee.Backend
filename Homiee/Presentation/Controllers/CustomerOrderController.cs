using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [Route("api/customer/orders")]
    [ApiController]
    [Authorize(Roles = "User")]
    public class CustomerOrderController : ControllerBase
    {
        private readonly ICustomerOrderService _service;

        public CustomerOrderController(ICustomerOrderService service)
        {
            _service = service;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst("userId")!.Value);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateOrderDto dto)
        {
            var result = await _service.CreateOrder(GetUserId(),dto.AddressId, dto);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var result = await _service.GetMyOrders(GetUserId());
            return StatusCode(result.StatusCode, result);
        }
        [HttpPost("from-cart")]
        public async Task<IActionResult> CheckoutFromCart([FromBody] int addressId)
        {
            var userId = int.Parse(User.FindFirst("userId").Value);
            return Ok(await _service.CreateOrderFromCart(userId, addressId));
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var result = await _service.GetOrderById(GetUserId(), id);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var result = await _service.CancelOrder(GetUserId(), id);
            return StatusCode(result.StatusCode, result);
        }
    }
}
