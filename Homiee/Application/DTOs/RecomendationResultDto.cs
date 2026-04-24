namespace Homiee.Application.DTOs
{
    public class RecomendationResultDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        public int SellerId { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public string? ThumbnailUrl { get; set; }
        public double Score { get; set; }
    }
}
