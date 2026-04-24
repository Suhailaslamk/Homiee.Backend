using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [Authorize(Roles = "User")]
    [ApiController]
    [Route("api/address")]
    public class AddressController : ControllerBase
    {
        private readonly IAddressService _service;

        public AddressController(IAddressService service)
        {
            _service = service;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                throw new UnauthorizedAccessException("Invalid or missing token");

            if (!int.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("Invalid userId claim");

            return userId;
        }


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await _service.GetAddresses(GetUserId());
            return StatusCode(result.StatusCode, result);
        }


        [HttpPost]
        public async Task<IActionResult> Create(CreateAddressDto dto)
        {
            var result = await _service.Create(GetUserId(), dto);
            return StatusCode(result.StatusCode, result);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateAddressDto dto)
        {
            var result = await _service.Update(GetUserId(), id, dto);
            return StatusCode(result.StatusCode, result);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.Delete(GetUserId(), id);
            return StatusCode(result.StatusCode, result);
        }
            
    }
}
