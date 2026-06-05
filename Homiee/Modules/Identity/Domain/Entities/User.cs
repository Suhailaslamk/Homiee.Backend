using Microsoft.AspNetCore.Identity;
using Homiee.Shared.Domain.Enums;
using Homiee.Shared.Domain.Entities;

namespace Homiee.Modules.Identity.Domain.Entities
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
        public string? ProfilePictureUrl { get; set; }
        public DateTime? LastOtpSentAt { get; set; }
    }
}
