using Homiee.Modules.Identity.Domain.Entities;

namespace Homiee.Modules.Identity.Application.IRepository
{
    public interface IRevokedAccessTokenRepository
    {
        Task AddAsync(RevokedAccessToken token);    
        Task<bool> IsRevokedAsync(string token);

        Task SaveChangesAsync();
    }
}
