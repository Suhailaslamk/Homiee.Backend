using Homiee.Modules.AiImage.Domain.Entities;
using Homiee.Modules.AiImage.Domain.Enums;

namespace Homiee.Modules.AiImage.Application.IRepository
{
    public interface IAiGenerationRepository
    {
        Task<AiGenerationRequest?> GetByIdAsync(int id);
        Task<AiGenerationRequest?> GetByIdAndUserAsync(int id, int userId);

        // Find a recent completed request for same user + prompt hash (for cache dedup)
        Task<AiGenerationRequest?> GetRecentCompletedByHashAsync(int userId, string promptHash, DateTime notOlderThan);

        Task AddAsync(AiGenerationRequest entity);
        Task SaveChangesAsync();
    }
}