namespace Homiee.Application.DTOs
{
    public class PaymentMethodBreakdownDto
    {
        public string Method { get; set; } = string.Empty;   // "COD" | "Online"
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
    }
}
