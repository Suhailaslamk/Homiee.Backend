using Homiee.Domain.Enums;

namespace Homiee.Domain.Entities
{
    public class OrderStatusHistory : BaseEntity
    {
        public int OrderId { get; set; }
        public OrderStatus Status { get; set; }
        public Order Order { get; set; }
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;



    }
}