using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    //[Authorize(Roles = "Customer")]
    [Authorize]
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
            return int.Parse(User.FindFirst("userId")!.Value);
        }

        [HttpGet]
        public async Task<IActionResult> Get()
            => Ok(await _service.GetAddresses(GetUserId()));

        [HttpPost]
        public async Task<IActionResult> Create(CreateAddressDto dto)
            => Ok(await _service.Create(GetUserId(), dto));

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateAddressDto dto)
            => Ok(await _service.Update(GetUserId(), id, dto));

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
            => Ok(await _service.Delete(GetUserId(), id));
    }
}
