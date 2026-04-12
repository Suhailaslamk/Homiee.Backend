using Homiee.Application.Interfaces.IRepository;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly AppDbContext _context;

        public PaymentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
        }

        public async Task<Payment?> GetByIdAsync(int id)
        {
            return await _context.Payments.FindAsync(id);
        }

        public async Task<Payment?> GetByGatewayIdAsync(string gatewayId)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.PaymentGatewayId == gatewayId);
        }

        public async Task<List<Payment>> GetByUserIdAsync(int userId)
        {
            return await _context.Payments
                .Where(p => p.UserId == userId)
                .ToListAsync();
        }
        public async Task<Payment?> GetByRazorpayOrderIdAsync(string razorpayOrderId)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.RazorpayOrderId == razorpayOrderId);
        }
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
