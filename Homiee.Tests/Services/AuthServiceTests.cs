//using Homiee.Application.DTOs;
//using Homiee.Application.DTOs.Auth;
//using Homiee.Application.Interfaces.IRepository;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Application.Services;
//using Homiee.Domain.Entities;
//using Microsoft.Extensions.Logging.Abstractions;
//using Moq;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using Microsoft.Extensions.Configuration;
//using System.Threading.Tasks;
//using Homiee.Application.Services;
//using Homiee.Application.Interfaces.IRepository;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Domain.Entities;
//using Homiee.Domain.Enums;
//using Microsoft.Extensions.Logging.Abstractions;
//using Moq;
//using System.Threading.Tasks;
//using Xunit;
//using FluentAssertions;

//namespace Homiee.Tests.Services
//{

//        public class AuthServiceTests
//        {
//            private readonly Mock<IUserRepository> _mockUserRepo = new();
//            private readonly Mock<IEmailService> _mockEmailService = new();
//            private readonly Mock<ITokenRepository> _mockTokenRepo = new();
//            private readonly Mock<IOtpRepository> _mockOtpRepo = new();
//            private readonly Mock<IConfiguration> _mockConfig = new();

//            public class AuthService CreateService() => new AuthService(
//                _mockUserRepo.Object,
//                _mockConfig.Object,
//                _mockEmailService.Object,
//                _mockTokenRepo.Object,
//                _mockOtpRepo.Object,
//                new NullLogger<AuthService>()
//            );

//            [Fact]
//            public async Task Register_ShouldReturnError_WhenDtoIsNull()
//            {
//                var service = CreateService();

//                var result = await service.Register(null);

//                result.StatusCode.Should().Be(400);
//                result.Message.Should().Be("Invalid Request");
//            }

//            [Fact]
//            public async Task Register_ShouldReturnError_WhenEmailContainsSpaces()
//            {
//                var service = CreateService();
//                var dto = new RegisterDto
//                {
//                    Email = "user @example.com",
//                    FullName = "Test User",
//                    Password = "Password@1"
//                };

//                var result = await service.Register(dto);

//                result.StatusCode.Should().Be(400);
//                result.Message.Should().Be("Email must not contain spaces");
//            }

//            [Fact]
//            public async Task Login_ShouldReturnError_WhenUserNotFound()
//            {
//                _mockUserRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
//                             .ReturnsAsync((User)null);
//                var service = CreateService();
//                var dto = new LoginDto
//                {
//                    Email = "user@example.com",
//                    Password = "Password@1"
//                };

//                var result = await service.Login(dto);

//                result.StatusCode.Should().Be(401);
//                result.Message.Should().Be("Invalid email or password");
//            }


//        }
//    }



//using FluentAssertions;
//using Homiee.Application.DTOs;
//using Homiee.Application.DTOs.Auth;
//using Homiee.Application.Interfaces.IRepository;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Application.Services;
//using Homiee.Domain.Entities;
//using Microsoft.Extensions.Configuration;
//using Microsoft.Extensions.Logging;
//using Moq;
//using Homiee.Infrastructure.Data;
//using Xunit;
//namespace Homiee.Tests.Services
//{

//    public class AuthServiceTests
//    {
//        [Fact]
//        public async Task Login_ShouldFail_WhenPasswordIsIncorrect()
//        {
//            // Arrange
//            var mockUserRepo = new Mock<IUserRepository>();
//            var mockTokenRepo = new Mock<ITokenRepository>();
//            var mockEmailService = new Mock<IEmailService>();
//            var mockOtpRepo = new Mock<IOtpRepository>();
//            var mockConfig = new Mock<IConfiguration>();
//            var mockLogger = new Mock<ILogger<AuthService>>();
//            var mockRevokedAccess = new Mock<IRevokedAccessTokenRepository>();
//            var mockSellerRepo = new Mock<ISellersRepository>(); 
//            var mockDeliveryPartnerRepo = new Mock<IDeliveryRepository>();
//            var mockAppDbContext = new Mock<AppDbContext>();

//            var user = new User
//            {
//                Id = 1,
//                Email = "test@gmail.com",
//                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Correct123!"),
//                IsEmailVerified = true,
//                IsBlocked = false
//            };

//            mockUserRepo.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
//                        .ReturnsAsync(user);

//            var service = new AuthService(
//                mockUserRepo.Object,
//                mockConfig.Object,
//                mockEmailService.Object,
//                mockTokenRepo.Object,
//                mockOtpRepo.Object,
//                mockLogger.Object,
//                mockRevokedAccess.Object,
//                mockSellerRepo.Object,
//                mockDeliveryPartnerRepo.Object,
//                mockAppDbContext.Object);

//            var dto = new LoginDto
//            {
//                Email = "test@gmail.com",
//                Password = "WrongPassword"
//            };

//            // Act
//            var result = await service.Login(dto);

//            // Assert
//            result.StatusCode.Should().Be(401);
//            result.Message.Should().Be("Invalid email or password");
//        }
//    }
//}