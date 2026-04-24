using Homiee.Domain.Enums;

namespace Homiee.Domain.Entities
{
    
    public class Order : BaseEntity
    {
        public int UserId { get; private set; }
        public int SellerId { get; private set; }
        public int AddressId { get; private set; }
        public decimal TotalAmount { get; private set; } = 0;
        public OrderStatus Status { get; private set; } = OrderStatus.Pending;

        // ✅ ENUM instead of string
        public PaymentMethod PaymentMethod { get; private set; } = PaymentMethod.COD;

        public string? RazorpayPaymentId { get; private set; }

        public User User { get; private set; }
        public Address Address { get; private set; }

        public Seller Seller { get; private set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public ICollection<OrderItem> Items { get; private set; } = new List<OrderItem>();

        private Order() { }

        public Order(int userId, int sellerId, int addressId, PaymentMethod paymentMethod = PaymentMethod.COD)
        {
            UserId = userId;
            SellerId = sellerId;
            AddressId = addressId;
            PaymentMethod = paymentMethod;
        }

        public void SetRazorpayPaymentId(string paymentId)
        {
            RazorpayPaymentId = paymentId;
        }

        public void AddItem(OrderItem item)
        {
            if (item.Quantity <= 0)
                throw new ArgumentException("Invalid quantity");

            Items.Add(item);
            TotalAmount += item.Price * item.Quantity;
        }

        public void UpdateStatus(OrderStatus status)
        {
            if (Status == OrderStatus.Cancelled)
                throw new InvalidOperationException("Cannot update a cancelled order");

            if (Status == OrderStatus.Delivered)
                throw new InvalidOperationException("Cannot update a delivered order");

            Status = status;
        }
    }
}