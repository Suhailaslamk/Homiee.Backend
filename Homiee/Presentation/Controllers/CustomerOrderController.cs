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
        //private readonly IPaymentService _paymentService;

        public CustomerOrderController(
            ICustomerOrderService orderService
            //IPaymentService paymentService
            )
        {
            _orderService = orderService;
            //_paymentService = paymentService;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id))
                throw new UnauthorizedAccessException("Invalid token");
            return id;
        }

        
        //[HttpPost]
        //public async Task<IActionResult> PlaceCodOrder([FromBody] CreateOrderDto dto)
        //{
        //    if (dto.PaymentMethod != PaymentMethod.COD)
        //        return BadRequest("Use /checkout/initiate-payment for online orders");

        //    var result = await _orderService.PlaceCodOrder(GetUserId(), dto);
        //    return StatusCode(result.StatusCode, result);
        //}

        
        [HttpPost("checkout/cod")]
        public async Task<IActionResult> CheckoutCod([FromBody] CheckoutFromCartDto dto)
        {
            //if (dto.PaymentMethod != PaymentMethod.COD)
            //    return BadRequest("Use /checkout/initiate-payment for online orders");

            var result = await _orderService.PlaceCodOrderFromCart(GetUserId(), dto.AddressId);
            return StatusCode(result.StatusCode, result);
        }

        
        //[HttpPost("checkout/initiate-payment")]
        //public async Task<IActionResult> InitiateOnlinePayment([FromBody] CheckoutFromCartDto dto)
        //{
        //    if (dto.PaymentMethod != PaymentMethod.Online)
        //        return BadRequest("Use /checkout/cod for COD orders");

        //    var result = await _paymentService.InitiatePayment(GetUserId(), dto.AddressId);
        //    return StatusCode(result.StatusCode, result);
        //}

        
        //[HttpPost("checkout/verify-payment")]
        //public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
        //{
        //    var result = await _paymentService.VerifyAndStorePaymentId(GetUserId(), dto);
        //    return StatusCode(result.StatusCode, result);
        //}

        

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