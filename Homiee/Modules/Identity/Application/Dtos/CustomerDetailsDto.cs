namespace Homiee.Modules.Identity.Application.Dtos
{
    public class CustomerDetailsDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string Status { get; set; } = default!;
        public bool IsEmailVerified { get; set; }
        public DateTime CreatedAt { get; set; }

    }
}
