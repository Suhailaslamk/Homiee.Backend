namespace Homiee.Domain.Entities
{
    public class SellerReview : BaseEntity
    {
        public int SellerId { get; private set; }
        public int UserId { get; private set; }
        public int OrderId { get; private set; }
        public int Rating { get; private set; }
        public string Comment { get; private set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public Seller Seller { get; private set; }
        public User User { get; private set; }
        public Order Order { get; private set; }

        private SellerReview() { }

        public SellerReview(int sellerId, int userId, int orderId, int rating, string comment)
        {
            if (rating < 1 || rating > 5)
                throw new ArgumentException("Rating must be between 1 and 5");
            SellerId = sellerId;
            UserId = userId;
            OrderId = orderId;
            Rating = rating;
            Comment = comment ?? string.Empty;
        }
    }
}