namespace Homiee.Application.DTOs
{
    public class SellerStoreDto
    {
        public int SellerId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? DistanceKm { get; set; }         // populated when lat/lng provided
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public int ProductCount { get; set; }
        public string? ProfileImageUrl { get; set; }
        public List<string> CategoryNames { get; set; } = new();
        public string? PhoneNumber { get; set; }

        /// <summary>Populated only when returned from a nearby-stores query.</summary>

    }
}
