using Homiee.Infrastructure.Data;
using Homiee.Presentation.Controllers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Homiee.Tests.Integration;

public class HomieeWebApplicationFactory : WebApplicationFactory<AuthController>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            var settings = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Server=(localdb)\\mssqllocaldb;Database=HomieeTests;Trusted_Connection=True;TrustServerCertificate=True",
                ["ConnectionStrings:Redis"] = "localhost:6379,abortConnect=false",
                ["JWT:Key"] = "homiee-test-jwt-key-that-is-long-enough-for-hmac",
                ["JWT:Issuer"] = "Homiee.Tests",
                ["JWT:Audience"] = "Homiee.Tests",
                ["JWT:ExpiresAt"] = "60",
                ["CacheSettings:CategoryTtlMinutes"] = "30",
                ["CacheSettings:ProductDetailTtlMinutes"] = "10",
                ["CacheSettings:SellerDetailTtlMinutes"] = "15",
                ["CacheSettings:StoreTtlMinutes"] = "5",
                ["CacheSettings:AdminAnalyticsTtlMinutes"] = "5",
                ["CacheSettings:AdminKpiTtlMinutes"] = "2",
                ["CacheSettings:SellerAnalyticsTtlMinutes"] = "5",
                ["CacheSettings:SellerKpiTtlMinutes"] = "2",
                ["CacheSettings:RecommendationTtlMinutes"] = "10",
                ["CacheSettings:CartTtlMinutes"] = "5",
                ["CacheSettings:WishlistTtlMinutes"] = "10",
                ["CacheSettings:RevokedTokenTtlMinutes"] = "15"
            };

            config.AddInMemoryCollection(settings);
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IHostedService>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase($"HomieeTests-{Guid.NewGuid()}"));
        });
    }
}
