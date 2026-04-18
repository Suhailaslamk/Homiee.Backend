namespace Homiee.Domain.Entities
{
    public class OrderStatusHistory : BaseEntity
    {

        public int OrderId { get; set; }

        public string Status { get; set; } = null!;
        public Order Order { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
