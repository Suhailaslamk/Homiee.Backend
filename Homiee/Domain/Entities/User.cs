using Microsoft.AspNetCore.Identity;
using Homiee.Domain.Enums;
namespace Homiee.Domain.Entities
{
    public class User : BaseEntity 
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;

        public string PasswordHash { get; set; } = null!;
        public bool IsEmailVerified { get; set; } = false;
        public UserRole Role { get; set; } = UserRole.User;
        public bool IsBlocked { get; set; } = false;
        public UserStatus Status { get;  set; }

        public DateTime? LastOtpSentAt { get; set; }
    }
}
