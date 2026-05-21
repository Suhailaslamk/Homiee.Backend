namespace Homiee.Application.DTOs
{
    public class ProductImageDto
    {
        public int Id { get; set; }
        public string Url { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
    }
}
