using Homiee.Modules.Identity.Application.IRepository;
using Homiee.Modules.Identity.Domain.Entities;
using Homiee.Shared.Applications.IServices;
using Homiee.Shared.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Modules.Identity.Infrastructure.Repositories;

public class RevokedAccessTokenRepository : IRevokedAccessTokenRepository
{
    private readonly AppDbContext _context;
    private readonly ICacheService _cache;
    private readonly TimeSpan _ttl = TimeSpan.FromMinutes(15);

    public RevokedAccessTokenRepository(AppDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task AddAsync(RevokedAccessToken token)
    {
        await _context.RevokedAccessTokens.AddAsync(token);
        // Pre-warm the cache so the very next request is served from Redis
        await _cache.SetAsync(CacheKey(token.Token), true, _ttl);
    }

    public async Task<bool> IsRevokedAsync(string token)
    {
        var key = CacheKey(token);

        // 1. Check Redis first — avoids SQL on every authenticated request
        var cached = await _cache.GetAsync<bool?>(key);
        if (cached.HasValue) return cached.Value;

        // 2. Fallback to DB
        var isRevoked = await _context.RevokedAccessTokens
            .AnyAsync(t => t.Token == token && t.ExpiresAt > DateTime.UtcNow);

        // 3. Cache the result either way (false = not revoked, saves future hits too)
        await _cache.SetAsync(key, isRevoked, _ttl);

        return isRevoked;
    }

    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();

    private static string CacheKey(string token) => $"revoked:{token}";
}