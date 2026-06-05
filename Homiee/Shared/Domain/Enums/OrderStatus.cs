namespace Homiee.Shared.Domain.Enums
{
    public enum OrderStatus
    {
        Pending = 0,
        Processing = 1,
        Placed = 2,
        Shipped = 3,
        Delivered = 4,
        Cancelled = 5,

        Accepted = 6,   // NEW
        Rejected = 7
    }
}