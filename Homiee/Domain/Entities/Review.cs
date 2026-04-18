namespace Homiee.Domain.Entities
{
    public class Review : BaseEntity
    {

        public int ProductId { get; private set; }
        public int UserId { get; private set; }

        public int Rating { get; private set; } // 1–5
        public string Comment { get; private set; }

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public Product Product { get; private set; }

        private Review() { }

        public Review(int productId, int userId, int rating, string comment)
        {
            ProductId = productId;
            UserId = userId;
            Rating = rating;
            Comment = comment;
        }
    }
}
