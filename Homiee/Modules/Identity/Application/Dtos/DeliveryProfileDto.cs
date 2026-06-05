namespace Homiee.Modules.Identity.Application.Dtos
{
    public class DeliveryProfileDto
    {
        public string VehicleType { get; set; } = default!;
        public bool IsAvailable { get; set; }
        public string? LicenseNumber { get; set; }
    }
}
