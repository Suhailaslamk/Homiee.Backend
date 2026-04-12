using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Homiee.Application.DTOs;


namespace Homiee.Application.Services
{

    public class SellerOrderService : ISellerOrderService
    {
        private readonly IOrderRepository _orderRepo;
        private readonly ISellersRepository _sellerRepo;

        public SellerOrderService(IOrderRepository orderRepo, ISellersRepository sellerRepo)
        {
            _orderRepo = orderRepo;
            _sellerRepo = sellerRepo;
        }

        public async Task<ApiResponse<PagedResult<SellerOrderDto>>> GetOrders(int userId, OrderQueryDto queryDto)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null)
                return new ApiResponse<PagedResult<SellerOrderDto>>(404, "Seller not found");

            var query = _orderRepo.Query()
                .Where(o => o.SellerId == seller.Id); // ✅ NOW VALID

            if (!string.IsNullOrEmpty(queryDto.Status))
            {
                if (Enum.TryParse<OrderStatus>(queryDto.Status, true, out var status))
                    query = query.Where(o => o.Status == status);
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((queryDto.Page - 1) * queryDto.PageSize)
                .Take(queryDto.PageSize)
                .Select(o => new SellerOrderDto
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync();

            var result = new PagedResult<SellerOrderDto>(
                200, "Success", items, total, queryDto.Page, queryDto.PageSize
            );

            return new ApiResponse<PagedResult<SellerOrderDto>>(200, "Orders fetched", result);
        }

        public async Task<ApiResponse<string>> UpdateStatus(int orderId, int userId, string status)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            var order = await _orderRepo.GetByIdAsync(orderId);

            if (order == null)
                return new ApiResponse<string>(404, "Order not found");

            if (order.SellerId != seller.Id)
                return new ApiResponse<string>(403, "Unauthorized");

            if (!Enum.TryParse<OrderStatus>(status, true, out var newStatus))
                return new ApiResponse<string>(400, "Invalid status");

            if (newStatus == OrderStatus.Delivered || newStatus == OrderStatus.Cancelled)
                return new ApiResponse<string>(403, "Not allowed");

            order.UpdateStatus(newStatus);

            await _orderRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Order updated");
        }
        public async Task<ApiResponse<SellerOrderGetDetailsDto>> GetOrderById(int orderId, int userId)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<SellerOrderGetDetailsDto>(404, "Seller not found");

            var order = await _orderRepo.Query()
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                return new ApiResponse<SellerOrderGetDetailsDto>(404, "Order not found");

            // 🔥 CRITICAL: seller can only see his items
            var sellerItems = order.Items
                .Where(i => i.SellerId == seller.Id)
                .ToList();

            if (!sellerItems.Any())
                return new ApiResponse<SellerOrderGetDetailsDto>(403, "Unauthorized");

            var dto = new SellerOrderGetDetailsDto
            {
                OrderId = order.Id,
                Status = order.Status.ToString(),
                TotalAmount = sellerItems.Sum(i => i.Price * i.Quantity),
                CreatedAt = order.CreatedAt,

                CustomerName = order.User.Name,
                CustomerEmail = order.User.Email,

                Items = sellerItems.Select(i => new SellerOrderItemsDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.Product.Name,
                    Quantity = i.Quantity,
                    Price = i.Price
                }).ToList()
            };

            return new ApiResponse<SellerOrderGetDetailsDto>(200, "Success", dto);
        }
    }
}

