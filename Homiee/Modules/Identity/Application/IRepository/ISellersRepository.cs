using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Identity.Domain.Entities;
using Homiee.Shared.Common;
using Homiee.Shared.Domain.Enums;

namespace Homiee.Modules.Identity.Application.IRepository
{
    public interface ISellersRepository
    {
       
            Task AddAsync(Seller seller);
            Task<Seller?> GetByUserIdAsync(int userId);
        Task<Seller?> GetWithUserAsync(int userId);
        Task SaveChangesAsync();
         Task<PagedResult<Seller>> GetFilteredAsync(SellerQueryParamsDto queryParams);
        Task<List<Seller>> GetByStatusAsync(ApprovalStatus status);
        //Task<List<Seller>> GetAllAsync();
        Task<List<Seller>> GetPagedAsync(int page, int pageSize);
        Task<bool> ExistsByUserIdAsync(int userId);
        Task<bool> ExistsByPhoneAsync(string phone,int userId);
            Task<bool> ExistsByGstAsync(string gst,int userId);
        IQueryable<Seller> Query();
    }
    
}
