namespace Homiee.Application.DTOs
{
    public class CreateSellerReviewDto
    {
        public int OrderId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
    }

    public class SellerReviewDto
    {
        public int Rating { get; set; }
        public string Comment { get; set; }
        public string? UserName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}