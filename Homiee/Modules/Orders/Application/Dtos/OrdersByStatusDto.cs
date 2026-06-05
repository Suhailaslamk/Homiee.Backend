namespace Homiee.Modules.Orders.Application.Dtos
{
    public class OrdersByStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
