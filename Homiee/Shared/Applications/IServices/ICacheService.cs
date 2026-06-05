namespace Homiee.Shared.Applications.IServices
{
    public interface ICacheService
    {
        Task<T?> GetAsync<T>(string key);
        Task SetAsync<T>(string key, T value, TimeSpan expiry);
        Task RemoveAsync(string key);
        Task RemoveByPrefixAsync(string prefix);  // uses SCAN
    }
}
