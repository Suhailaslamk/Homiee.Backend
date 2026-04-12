using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface ITokenRepository
    {
        Task AddAsync(RefreshToken reToken);
        Task SaveChangesAsync();

        Task<List<RefreshToken>> GetRefreshTokenByAsync(int userId);
        Task<RefreshToken?> GetByTokenAsync(string token);

    }

}
