using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Enums;
using Microsoft.EntityFrameworkCore;


namespace Homiee.Application.Services
{
    public class AdminCustomerService : IAdminCustomerService
    {
        private readonly IUserRepository _userRepo;
        private readonly IOrderRepository _orderRepo;

        public AdminCustomerService(IUserRepository userRepo, IOrderRepository orderRepo)
        {
            _userRepo = userRepo;
            _orderRepo = orderRepo;
        }

        // ✅ 1. GET PAGINATED CUSTOMERS
        public async Task<ApiResponse<PagedResult<CustomerDto>>> GetCustomers(CustomerQueryDto  query)
        {
            var usersQuery = _userRepo.Query()
                .AsNoTracking()
                .Where(u => !u.IsDeleted); // adjust if needed

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.ToLower();
                usersQuery = usersQuery.Where(u =>
                    u.Name.ToLower().Contains(search) ||
                    u.Email.ToLower().Contains(search));
            }

            if (!string.IsNullOrEmpty(query.Status) && query.Status.ToLower() != "all")
            {
                usersQuery = usersQuery.Where(u => u.Status.ToString().ToLower() == query.Status.ToLower());
            }

            var total = await usersQuery.CountAsync();

            var users = await usersQuery
                .OrderByDescending(u => u.CreatedOn)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(u => new CustomerDto
                {
                    Id = u.Id,
                    FullName = u.Name,
                    Email = u.Email,
                    Status = u.Status.ToString(),
                    CreatedAt = u.CreatedOn
                })
                .ToListAsync();

            var result = new PagedResult<CustomerDto>(200, "Success", users, total, query.Page, query.PageSize);

            return new ApiResponse<PagedResult<CustomerDto>>(200, "Success", result);
        }

        // ✅ 2. GET CUSTOMER BY ID
        public async Task<ApiResponse<CustomerDetailsDto>> GetCustomerById(int id)
        {
            var user = await _userRepo.Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

            if (user == null)
                return new ApiResponse<CustomerDetailsDto>(404, "Customer not found");

            var dto = new CustomerDetailsDto
            {
                Id = user.Id,
                FullName = user.Name,
                Email = user.Email,
                Status = user.Status.ToString(),
                IsEmailVerified = user.IsEmailVerified,
                CreatedAt = user.CreatedOn
            };

            return new ApiResponse<CustomerDetailsDto>(200, "Success", dto);
        }

        // ✅ 3. GET CUSTOMER ORDERS
        public async Task<ApiResponse<List<OrderDetailsDto>>> GetCustomerOrders(int customerId)
        {
            var orders = await _orderRepo.Query()
                .Where(o => o.UserId == customerId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new OrderDetailsDto
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync();

            return new ApiResponse<List<OrderDetailsDto>>(200, "Success", orders);
        }

        // ✅ 4. BLOCK CUSTOMER
        public async Task<ApiResponse<string>> BlockCustomer(int id, string? reason)
        {
            var user = await _userRepo.GetByIdAsync(id);

            if (user == null || user.IsDeleted)
                return new ApiResponse<string>(404, "Customer not found");

            user.Status = UserStatus.Blocked;

            // optional: store reason if you have field
            // user.BlockReason = reason;

            await _userRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Customer blocked");
        }

        // ✅ 5. UNBLOCK CUSTOMER
        public async Task<ApiResponse<string>> UnblockCustomer(int id)
        {
            var user = await _userRepo.GetByIdAsync(id);

            if (user == null || user.IsDeleted)
                return new ApiResponse<string>(404, "Customer not found");

            user.Status = UserStatus.Active;

            await _userRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Customer unblocked");
        }

        // ✅ 6. DELETE (SOFT DELETE)
        public async Task<ApiResponse<string>> DeleteCustomer(int id)
        {
            var user = await _userRepo.GetByIdAsync(id);

            if (user == null || user.IsDeleted)
                return new ApiResponse<string>(404, "Customer not found");

            user.IsDeleted = true;
            user.Status = UserStatus.Deleted;

            await _userRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Customer deleted");
        }
    }
}
