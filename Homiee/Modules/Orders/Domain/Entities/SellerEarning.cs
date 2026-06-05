using Homiee.Modules.Identity.Domain.Entities;
using Homiee.Shared.Domain.Entities;
using Homiee.Shared.Domain.Enums;

namespace Homiee.Modules.Orders.Domain.Entities
{

    public class SellerEarning : BaseEntity
    {
        public int SellerId { get; private set; }
        public int OrderId { get; private set; }
        public decimal Amount { get; private set; }
        public EarningStatus Status { get; private set; } = EarningStatus.Pending;
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public DateTime? AvailableAt { get; private set; }
        public DateTime? PaidAt { get; private set; }

        // Navigation
        public Seller Seller { get; private set; } = null!;
        public Order Order { get; private set; } = null!;

        private SellerEarning() { }

        public SellerEarning(int sellerId, int orderId, decimal amount)
        {
            if (amount <= 0) throw new ArgumentException("Earning amount must be positive");
            SellerId = sellerId;
            OrderId = orderId;
            Amount = amount;
        }

        /// <summary>Called after hold period — earning is now withdrawable</summary>
        public void MarkAvailable()
        {
            if (Status != EarningStatus.Pending)
                throw new InvalidOperationException("Only pending earnings can be marked available");
            Status = EarningStatus.Available;
            AvailableAt = DateTime.UtcNow;
        }

        /// <summary>Called when admin processes a payout</summary>
        public void MarkPaid()
        {
            if (Status != EarningStatus.Available)
                throw new InvalidOperationException("Only available earnings can be marked paid");
            Status = EarningStatus.Paid;
            PaidAt = DateTime.UtcNow;
        }
    }
}

