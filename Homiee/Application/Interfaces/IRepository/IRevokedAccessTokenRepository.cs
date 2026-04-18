using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface IRevokedAccessTokenRepository
    {
        Task AddAsync(RevokedAccessToken token);    
        Task<bool> IsRevokedAsync(string token);

        Task SaveChangesAsync();
    }
}
