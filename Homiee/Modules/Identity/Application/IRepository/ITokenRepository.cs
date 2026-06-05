using Homiee.Modules.Identity.Domain.Entities;

namespace Homiee.Modules.Identity.Application.IRepository
{
    public interface ITokenRepository
    {
        Task AddAsync(RefreshToken reToken);
        Task SaveChangesAsync();

        Task<List<RefreshToken>> GetRefreshTokenByAsync(int userId);
        Task<RefreshToken?> GetByTokenAsync(string token);
        Task<List<RefreshToken>> GetAllTokensByUserIdAsync(int userId);

    }

}
