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
        // FIX #1: _paymentService was used in InitiatePayment but was never declared
        // or injected — this caused a compile error and a guaranteed NullReferenceException
        // at runtime. Injected here via constructor.
        private readonly IPaymentService _paymentService;

        public CustomerOrderController(
            ICustomerOrderService service,
            IPaymentService paymentService)
        {
            _service = service;
            _paymentService = paymentService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst("userId")!.Value);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateOrderDto dto)
        {
            var result = await _service.CreateOrder(GetUserId(), dto.AddressId, dto);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var result = await _service.GetMyOrders(GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("from-cart")]
        public async Task<IActionResult> CheckoutFromCart(CheckoutFromCartDto dto)
        {
            var result = await _service.CreateOrderFromCart(GetUserId(), dto.AddressId);
            return StatusCode(result.StatusCode, result);
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

        [HttpPost("checkout/initiate-payment")]
        public async Task<IActionResult> InitiatePayment([FromBody] CheckoutFromCartDto dto)
        {
            // FIX #1: Now works — _paymentService is properly injected above
            var result = await _paymentService.InitiatePayment(GetUserId(), dto.AddressId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("{id}/status-history")]
        public async Task<IActionResult> GetOrderStatusHistory(int id)
        {
            // FIX #2: GetOrderStatusHistory now exists on ICustomerOrderService
            // and is implemented in CustomerOrderService. Was a compile error before.
            var result = await _service.GetOrderStatusHistory(GetUserId(), id);
            return StatusCode(result.StatusCode, result);
        }
    }
}