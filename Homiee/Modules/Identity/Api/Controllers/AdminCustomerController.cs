using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Identity.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace Homiee.Modules.Identity.Api.Controllers
{
    
        [ApiController]
        [Route("api/admin/customers")]
    [Authorize(Roles = "Admin")]
    public class AdminCustomersController : ControllerBase
        {
            private readonly IAdminCustomerService _service;

            public AdminCustomersController(IAdminCustomerService service)
            {
                _service = service;
            }

            [HttpGet]
            public async Task<IActionResult> GetCustomers([FromQuery] CustomerQueryDto query)
            {
                var result = await _service.GetCustomers(query);
                return StatusCode(result.StatusCode, result);
            }

            [HttpGet("{id}")]
            public async Task<IActionResult> GetCustomer(int id)
            {
                var result = await _service.GetCustomerById(id);
                return StatusCode(result.StatusCode, result);
            }

            [HttpGet("{id}/orders")]
            public async Task<IActionResult> GetCustomerOrders(int id)
            {
                var result = await _service.GetCustomerOrders(id);
                return StatusCode(result.StatusCode, result);
            }

            [HttpPatch("{id}/block")]
            public async Task<IActionResult> Block(int id, [FromBody] string? reason)
            {
                var result = await _service.BlockCustomer(id, reason);
                return StatusCode(result.StatusCode, result);
            }

            [HttpPatch("{id}/unblock")]
            public async Task<IActionResult> Unblock(int id)
            {
                var result = await _service.UnblockCustomer(id);
                return StatusCode(result.StatusCode, result);
            }

            [HttpDelete("{id}")]
            public async Task<IActionResult> Delete(int id)
            {
                var result = await _service.DeleteCustomer(id);
                return StatusCode(result.StatusCode, result);
            }
        }
    }
