namespace Homiee.Application.DTOs
{
    public class UpdateProfileDto
    {
        public string Name { get; set; } = null!;

        // seller fields (optional depending on role)
        public string? BusinessName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? GSTNumber { get; set; }
    }
}
