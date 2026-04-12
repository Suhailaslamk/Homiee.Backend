namespace Homiee.Domain.Entities
{
    public class PendingOrder : BaseEntity
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string CartSnapshot { get; set; } // JSON
        public decimal TotalAmount { get; set; }
        public string RazorpayOrderId { get; set; }
        public string RazorpayPaymentId { get; set; }
        public int AddressId { get; set; }
    }
}
