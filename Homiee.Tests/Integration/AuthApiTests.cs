using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Homiee.Application.DTOs;
using Homiee.Application.DTOs.Auth;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace Homiee.Tests.Integration;

public class AuthApiTests : IClassFixture<HomieeWebApplicationFactory>
{
    private readonly HomieeWebApplicationFactory _factory;

    public AuthApiTests(HomieeWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_ShouldReturnValidationProblem_WhenPayloadIsInvalid()
    {
        using var client = CreateClientWithAuthService(new Mock<IAuthService>());

        var response = await client.PostAsJsonAsync("/api/auth/login", new { email = "not-an-email" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("One or more validation errors occurred.");
        body.Should().Contain("Invalid email format");
        body.Should().Contain("Password is required");
    }

    [Fact]
    public async Task Login_ShouldReturnServiceStatusCode_AndBody()
    {
        var authService = new Mock<IAuthService>();
        authService
            .Setup(x => x.Login(It.Is<LoginDto>(dto =>
                dto.Email == "customer@homiee.test" &&
                dto.Password == "WrongPassword1!")))
            .ReturnsAsync(new ApiResponse<object>(401, "Invalid email or password"));

        using var client = CreateClientWithAuthService(authService);

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "customer@homiee.test",
            password = "WrongPassword1!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(401);
        result.Message.Should().Be("Invalid email or password");

        authService.Verify(x => x.Login(It.IsAny<LoginDto>()), Times.Once);
    }

    [Fact]
    public async Task RegisterCustomer_ShouldReturnCreatedResponse_FromService()
    {
        var authService = new Mock<IAuthService>();
        authService
            .Setup(x => x.RegisterCustomer(It.Is<UserRegisterDto>(dto =>
                dto.Email == "new.customer@homiee.test" &&
                dto.FullName == "New Customer")))
            .ReturnsAsync(new ApiResponse<string>(201, "Customer registered", "otp-sent"));

        using var client = CreateClientWithAuthService(authService);

        var response = await client.PostAsJsonAsync("/api/auth/register/customer", new
        {
            fullName = "New Customer",
            email = "new.customer@homiee.test",
            password = "Password1!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<string>>();
        result.Should().NotBeNull();
        result!.Data.Should().Be("otp-sent");
        result.IsSuccess.Should().BeTrue();
    }

    private HttpClient CreateClientWithAuthService(Mock<IAuthService> authService)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IAuthService>();
                services.AddSingleton(authService.Object);
            });
        }).CreateClient();
    }
}
