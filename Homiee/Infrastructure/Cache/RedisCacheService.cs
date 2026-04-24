using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.EntityFrameworkCore.Storage;
using StackExchange.Redis;
using System.Text.Json;
using RedisDb = StackExchange.Redis.IDatabase;
using RedisServer = StackExchange.Redis.IServer;


namespace Homiee.Infrastructure.Cache;

public class RedisCacheService : ICacheService
{
    private readonly RedisDb _db;
    private readonly RedisServer _server;
    private readonly IConnectionMultiplexer _redis;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _db = redis.GetDatabase();

        // GetServer requires the endpoint — pick the first connected one
        var endpoint = redis.GetEndPoints().First();
        _server = redis.GetServer(endpoint);
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var val = await _db.StringGetAsync(key);
        if (!val.HasValue) return default;
        return JsonSerializer.Deserialize<T>(val!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan expiry)
    {
        var json = JsonSerializer.Serialize(value);
        await _db.StringSetAsync(key, json, expiry);
    }

    public async Task RemoveAsync(string key)
        => await _db.KeyDeleteAsync(key);

    // Scans for keys matching the prefix pattern and deletes them in a pipeline.
    // NOTE: SCAN is O(N) on large keyspaces — use specific key patterns (short prefixes).
    public async Task RemoveByPrefixAsync(string prefix)
    {
        var keys = _server.Keys(pattern: $"{prefix}*").ToArray();
        if (keys.Length > 0)
            await _db.KeyDeleteAsync(keys);
    }
}