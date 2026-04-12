using Homiee.Domain.Entities;
using Homiee.Domain.Enums;

namespace Homiee.Tests.Helpers
{
    public static class TestData
    {
        public static User CreateUser() => new User
        {
            Id = 1,
            Name = "Test User",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password@1"),
            IsEmailVerified = true,
            Role = UserRole.User
        };
    }
}