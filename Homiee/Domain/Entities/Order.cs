using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
namespace Homiee.Domain.Entities
{


    public class Order : BaseEntity
    {
        public int Id { get; private set; }
        public int UserId { get; private set; }
        public int SellerId { get; private set; }
        public int AddressId { get; private set; }

        public decimal TotalAmount { get; private set; } = 0;

        public OrderStatus Status { get; private set; } = OrderStatus.Pending;
        public User User { get; private set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public Address Address { get; private set; }

        public ICollection<OrderItem> Items { get; private set; } = new List<OrderItem>();

        private Order() { }

        public Order(int userId, int sellerId, int addressId)
        {
            UserId = userId;
            SellerId = sellerId;
            AddressId = addressId;
        }

        public void AddItem(OrderItem item)
        {
            if (item.Quantity <= 0)
                throw new Exception("Invalid quantity");

            Items.Add(item);
            TotalAmount += item.Price * item.Quantity;
        }

        public void UpdateStatus(OrderStatus status)
        {
            if (Status == OrderStatus.Cancelled)
                throw new Exception("Cannot update cancelled order");

            Status = status;
        }
    }
}