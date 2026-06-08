using Homiee.Modules.AiImage.Application.IRepository;
using Homiee.Modules.AiImage.Domain.Entities;
using Homiee.Modules.AiImage.Domain.Enums;
using Homiee.Shared.Applications.IData;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Modules.AiImage.Infrastructure.Repositories
{
    public class AiGenerationRepository : IAiGenerationRepository
    {
        private readonly IApplicationDbContext _db;

        public AiGenerationRepository(IApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<AiGenerationRequest?> GetByIdAsync(int id)
            => await _db.Set<AiGenerationRequest>().FindAsync(id);

        public async Task<AiGenerationRequest?> GetByIdAndUserAsync(int id, int userId)
            => await _db.Set<AiGenerationRequest>()
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId && !r.IsDeleted);

        public async Task<AiGenerationRequest?> GetRecentCompletedByHashAsync(
            int userId, string promptHash, DateTime notOlderThan)
            => await _db.Set<AiGenerationRequest>()
                .AsNoTracking()
                .Where(r =>
                    r.UserId == userId &&
                    r.PromptHash == promptHash &&
                    r.Status == GenerationStatus.Completed &&
                    r.GeneratedImageUrlsJson != null &&
                    r.CreatedOn >= notOlderThan &&
                    !r.IsDeleted)
                .OrderByDescending(r => r.CreatedOn)
                .FirstOrDefaultAsync();

        public async Task AddAsync(AiGenerationRequest entity)
            => await _db.Set<AiGenerationRequest>().AddAsync(entity);

        public async Task SaveChangesAsync()
            => await _db.SaveChangesAsync();
    }
}