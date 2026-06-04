using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace Homiee.Tests.Integration;

public class MarketplaceApiTests : IClassFixture<HomieeWebApplicationFactory>
{
    private readonly HomieeWebApplicationFactory _factory;

    public MarketplaceApiTests(HomieeWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetCategories_ShouldReturnCategories_FromService()
    {
        var marketplaceService = new Mock<IMarketplaceQueryService>();
        marketplaceService
            .Setup(x => x.GetCategories())
            .ReturnsAsync(new ApiResponse<List<CategoryDto>>(
                200,
                "Categories loaded",
                new List<CategoryDto>
                {
                    new() { Id = 1, Name = "Groceries", IsActive = true },
                    new() { Id = 2, Name = "Home Services", IsActive = true }
                }));

        using var client = CreateClientWithMarketplaceService(marketplaceService);

        var response = await client.GetAsync("/api/marketplace/categories");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<CategoryDto>>>();
        result.Should().NotBeNull();
        result!.Data.Should().HaveCount(2);
        result.Data![0].Name.Should().Be("Groceries");
        marketplaceService.Verify(x => x.GetCategories(), Times.Once);
    }

    [Fact]
    public async Task GetProducts_ShouldBindQueryString_AndReturnPagedProducts()
    {
        var marketplaceService = new Mock<IMarketplaceQueryService>();
        marketplaceService
            .Setup(x => x.GetProducts(It.Is<ProductQuery>(query =>
                query.Page == 2 &&
                query.PageSize == 5 &&
                query.Search == "rice" &&
                query.InStockOnly == true)))
            .ReturnsAsync(new ApiResponse<PagedResult<ProductListDto>>(
                200,
                "Products loaded",
                new PagedResult<ProductListDto>(
                    200,
                    "Products loaded",
                    new List<ProductListDto>(),
                    totalCount: 0,
                    page: 2,
                    pageSize: 5)));

        using var client = CreateClientWithMarketplaceService(marketplaceService);

        var response = await client.GetAsync("/api/marketplace/products?page=2&pageSize=5&search=rice&inStockOnly=true");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ProductListDto>>>();
        result.Should().NotBeNull();
        result!.Data!.Page.Should().Be(2);
        result.Data.PageSize.Should().Be(5);
        marketplaceService.Verify(x => x.GetProducts(It.IsAny<ProductQuery>()), Times.Once);
    }

    private HttpClient CreateClientWithMarketplaceService(Mock<IMarketplaceQueryService> marketplaceService)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IMarketplaceQueryService>();
                services.RemoveAll<IReviewService>();
                services.RemoveAll<IRecommendationService>();

                services.AddSingleton(marketplaceService.Object);
                services.AddSingleton(Mock.Of<IReviewService>());
                services.AddSingleton(Mock.Of<IRecommendationService>());
            });
        }).CreateClient();
    }
}
