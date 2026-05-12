namespace Homiee.Application.DTOs
{
   
        public class AdminOrderDetailsDto
        {
            public int OrderId { get; set; }
            public string Status { get; set; }
            public decimal TotalAmount { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime? RequestedDeliveryDate { get; set; }

            public CustomerForAdminOrderDetailsDto Customer { get; set; }
            public SellerInfoForAdminOrderDetailsDto Seller { get; set; }

            public List<IOrderItemForAdminOrderDetailsDto> Items { get; set; }
        }
    
}
