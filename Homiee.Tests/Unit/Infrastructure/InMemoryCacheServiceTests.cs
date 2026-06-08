using FluentAssertions;
using Homiee.Shared.Infrastructure.Cache;
using Microsoft.Extensions.Caching.Memory;

namespace Homiee.Tests.Unit.Infrastructure;

public class InMemoryCacheServiceTests
{
    [Fact]
    public async Task SetAsync_AndGetAsync_ShouldRoundTripValue()
    {
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var service = new InMemoryCacheService(memoryCache);

        await service.SetAsync("category:1", "Fresh Produce", TimeSpan.FromMinutes(5));

        var value = await service.GetAsync<string>("category:1");
        value.Should().Be("Fresh Produce");
    }

    [Fact]
    public async Task RemoveAsync_ShouldDeleteValue()
    {
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var service = new InMemoryCacheService(memoryCache);

        await service.SetAsync("product:1", 42, TimeSpan.FromMinutes(5));
        await service.RemoveAsync("product:1");

        var value = await service.GetAsync<int?>("product:1");
        value.Should().BeNull();
    }

    [Fact]
    public async Task RemoveByPrefixAsync_ShouldDeleteOnlyMatchingKeys()
    {
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var service = new InMemoryCacheService(memoryCache);

        await service.SetAsync("seller:1", "A", TimeSpan.FromMinutes(5));
        await service.SetAsync("seller:2", "B", TimeSpan.FromMinutes(5));
        await service.SetAsync("product:1", "C", TimeSpan.FromMinutes(5));

        await service.RemoveByPrefixAsync("seller:");

        (await service.GetAsync<string>("seller:1")).Should().BeNull();
        (await service.GetAsync<string>("seller:2")).Should().BeNull();
        (await service.GetAsync<string>("product:1")).Should().Be("C");
    }
}
