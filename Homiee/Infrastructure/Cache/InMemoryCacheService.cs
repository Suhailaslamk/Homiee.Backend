using Homiee.Application.Interfaces.IServices;
using Microsoft.Extensions.Caching.Memory;

namespace Homiee.Infrastructure.Cache;

public class InMemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private static readonly HashSet<string> _keys = new();

    public InMemoryCacheService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task<T?> GetAsync<T>(string key)
    {
        _cache.TryGetValue(key, out T? value);
        return Task.FromResult(value);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan expiry)
    {
        _cache.Set(key, value, expiry);
        lock (_keys) _keys.Add(key);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key)
    {
        _cache.Remove(key);
        lock (_keys) _keys.Remove(key);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix)
    {
        List<string> toRemove;
        lock (_keys)
        {
            toRemove = _keys.Where(k => k.StartsWith(prefix)).ToList();
            foreach (var k in toRemove) _keys.Remove(k);
        }
        foreach (var k in toRemove) _cache.Remove(k);
        return Task.CompletedTask;
    }
}
