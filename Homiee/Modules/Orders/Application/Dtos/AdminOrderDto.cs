namespace Homiee.Modules.Orders.Application.Dtos
{
    public class AdminOrderDto
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int SellerId { get; set; }

        public decimal TotalAmount { get; set; }

        public string Status { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
