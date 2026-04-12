using Homiee.Domain.Enums;

namespace Homiee.Domain.Entities
{
    public class Payment : BaseEntity
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public decimal Amount { get; set; }
        public PaymentStatus Status { get; set; } // Pending, Success, Failed
        public string PaymentGatewayId { get; set; }
        public string Provider { get; set; } // Razorpay, Stripe
        public string RazorpayOrderId { get; set; }   // ✅ ADD
        public string RazorpayPaymentId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
