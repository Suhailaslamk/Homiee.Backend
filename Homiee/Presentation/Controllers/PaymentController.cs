
using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Homiee.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace Homiee.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IConfiguration _config;

        public PaymentController(IPaymentService paymentService, IConfiguration config)
        {
            _paymentService = paymentService;
            _config = config;
        }

        [HttpPost("initiate")]
        public async Task<IActionResult> Initiate(int addressId)
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim == null)
                return Unauthorized();

            var userId = int.Parse(userIdClaim);

            var result = await _paymentService.InitiatePayment(userId, addressId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] VerifyPaymentDto dto)
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim == null)
                return Unauthorized();

            var userId = int.Parse(userIdClaim);

            var result = await _paymentService.VerifyPayment(userId, dto);
            return StatusCode(result.StatusCode, result);
        }

        // FIX #5: [AllowAnonymous] is mandatory here.
        // The class-level [Authorize] was blocking ALL Razorpay webhook calls with 401
        // because Razorpay has no JWT token to send. This meant payment.captured events
        // were being rejected and orders were never being created after successful payment.
        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<IActionResult> RazorpayWebhook()
        {
            var json = await new StreamReader(Request.Body).ReadToEndAsync();
            var signature = Request.Headers["X-Razorpay-Signature"].FirstOrDefault();
            var secret = _config["Razorpay:WebhookSecret"];

            if (string.IsNullOrEmpty(signature))
                return Unauthorized("Missing signature");

            if (!VerifySignature(json, signature, secret))
                return Unauthorized("Invalid signature");

            await _paymentService.HandleWebhook(json);

            return Ok();
        }

        [HttpGet("status/{orderId}")]
        public async Task<IActionResult> Status(string orderId)
        {
            var result = await _paymentService.GetPaymentStatus(orderId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("retry/{orderId}")]
        public async Task<IActionResult> Retry(string orderId)
        {
            var result = await _paymentService.RetryPayment(orderId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingPayment()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim == null)
                return Unauthorized();

            var userId = int.Parse(userIdClaim);

            var result = await _paymentService.GetPendingPayment(userId);
            return StatusCode(result.StatusCode, result);
        }

        private bool VerifySignature(string payload, string signature, string secret)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secret);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);

            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(payloadBytes);
            var generatedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(generatedSignature),
                Encoding.UTF8.GetBytes(signature)
            );
        }
    }
}


