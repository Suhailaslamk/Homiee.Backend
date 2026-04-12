using Microsoft.Extensions.Configuration.UserSecrets;

namespace Homiee.Domain.Entities
{
    public class RefreshToken : BaseEntity
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string Token { get; set; } = null!;
        public DateTime Expires { get; set; }

        public bool IsRevoked { get; set; } = false;

        public User User { get; set; } = null!;

    }
}
