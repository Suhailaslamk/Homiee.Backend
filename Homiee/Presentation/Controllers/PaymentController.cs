//using Homiee.Application.DTOs;
//using Homiee.Application.Interfaces.IServices;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using System.Security.Cryptography;
//using System.Text;

//namespace Homiee.Presentation.Controllers
//{
//    [Authorize]
//    [ApiController]
//    [Route("api/payment")]
//    public class PaymentController : ControllerBase
//    {
//        private readonly IPaymentService _paymentService;
//        private readonly IConfiguration _config;

//        public PaymentController(IPaymentService paymentService, IConfiguration config)
//        {
//            _paymentService = paymentService;
//            _config = config;
//        }

//        private int GetUserId()
//        {
//            var claim = User.FindFirst("userId")?.Value;
//            if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id))
//                throw new UnauthorizedAccessException("Invalid token");
//            return id;
//        }

//        // Initiate is exposed on CustomerOrderController as well.
//        // This endpoint stays for standalone / non-cart payment flows.
//        [HttpPost("initiate")]
//        public async Task<IActionResult> Initiate([FromQuery] int addressId)
//        {
//            var result = await _paymentService.InitiatePayment(GetUserId(), addressId);
//            return StatusCode(result.StatusCode, result);
//        }

//        [HttpPost("verify")]
//        public async Task<IActionResult> Verify([FromBody] VerifyPaymentDto dto)
//        {
//            var result = await _paymentService.VerifyAndStorePaymentId(GetUserId(), dto);
//            return StatusCode(result.StatusCode, result);
//        }

//        // Webhook is anonymous — Razorpay calls this directly.
//        // Signature is verified before delegating to the service.
//        [AllowAnonymous]
//        [HttpPost("webhook")]
//        public async Task<IActionResult> RazorpayWebhook()
//        {
//            var json = await new StreamReader(Request.Body).ReadToEndAsync();
//            var signature = Request.Headers["X-Razorpay-Signature"].FirstOrDefault();
//            var secret = _config["Razorpay:WebhookSecret"];

//            if (string.IsNullOrEmpty(signature))
//                return Unauthorized("Missing signature");

//            if (!VerifySignature(json, signature, secret))
//                return Unauthorized("Invalid signature");

//            await _paymentService.HandleWebhook(json);
//            return Ok();
//        }

//        [HttpGet("status/{razorpayOrderId}")]
//        public async Task<IActionResult> Status(string razorpayOrderId)
//        {
//            var result = await _paymentService.GetPaymentStatus(razorpayOrderId);
//            return StatusCode(result.StatusCode, result);
//        }

//        [HttpPost("retry/{razorpayOrderId}")]
//        public async Task<IActionResult> Retry(string razorpayOrderId)
//        {
//            var result = await _paymentService.RetryPayment(razorpayOrderId);
//            return StatusCode(result.StatusCode, result);
//        }

//        [HttpGet("pending")]
//        public async Task<IActionResult> GetPending()
//        {
//            var result = await _paymentService.GetPendingPayment(GetUserId());
//            return StatusCode(result.StatusCode, result);
//        }

//        // ── HMAC-SHA256 signature verification ───────────────────────────
//        private static bool VerifySignature(string payload, string signature, string secret)
//        {
//            var key = Encoding.UTF8.GetBytes(secret);
//            var data = Encoding.UTF8.GetBytes(payload);

//            using var hmac = new HMACSHA256(key);
//            var hash = hmac.ComputeHash(data);
//            var generated = BitConverter.ToString(hash).Replace("-", "").ToLower();

//            // Constant-time compare prevents timing attacks
//            return CryptographicOperations.FixedTimeEquals(
//                Encoding.UTF8.GetBytes(generated),
//                Encoding.UTF8.GetBytes(signature));
//        }
//    }
//}