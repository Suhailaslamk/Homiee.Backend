using System.Text.Json.Serialization;
using Homiee.Shared.Domain.Enums;

namespace Homiee.Modules.Orders.Application.Dtos
{
    public class UpdateOrderStatusDto
    {
        public OrderStatus Status { get; set; }
    }
}
