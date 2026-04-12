using Dapper;
using Homiee.Application.DTOs;

using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Infrastructure.Data;

namespace Homiee.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly DapperContext _context;

        public DashboardService(DapperContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<AdminDashboardDto>> GetAdminDashboard()
        {
            using var connection = _context.CreateConnection();

            var sql = @"
                SELECT 
                    (SELECT COUNT(*) FROM Users WHERE IsDeleted = 0) AS TotalUsers,
                    (SELECT COUNT(*) FROM Sellers) AS TotalSellers,
                    (SELECT COUNT(*) FROM Orders) AS TotalOrders,
                    (SELECT ISNULL(SUM(TotalAmount),0) FROM Orders WHERE Status = 'Delivered') AS TotalRevenue
            ";

            var result = await connection.QueryFirstOrDefaultAsync<AdminDashboardDto>(sql);

            return new ApiResponse<AdminDashboardDto>(200, "Success", result);
        }

        public async Task<ApiResponse<SellerDashboardDto>> GetSellerDashboard(int sellerId)
        {
            using var connection = _context.CreateConnection();

            var sql = @"
                SELECT 
                    (SELECT COUNT(*) FROM Products WHERE SellerId = @SellerId AND IsDeleted = 0) AS TotalProducts,
                    
                    (SELECT COUNT(*) FROM Orders WHERE SellerId = @SellerId) AS TotalOrders,
                    
                    (SELECT ISNULL(SUM(TotalAmount),0) 
                     FROM Orders 
                     WHERE SellerId = @SellerId AND Status = 'Delivered') AS TotalRevenue,
                    
                    (SELECT COUNT(*) 
                     FROM Products 
                     WHERE SellerId = @SellerId AND Stock < 5 AND IsDeleted = 0) AS LowStockProducts
            ";

            var result = await connection.QueryFirstOrDefaultAsync<SellerDashboardDto>(
                sql,
                new { SellerId = sellerId }
            );

            return new ApiResponse<SellerDashboardDto>(200, "Success", result);
        }
    }
}