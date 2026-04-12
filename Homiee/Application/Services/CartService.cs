using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Domain.Entities;

namespace Homiee.Application.Services
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepo;
        private readonly IProductRepository _productRepo;

        public CartService(ICartRepository cartRepo, IProductRepository productRepo)
        {
            _cartRepo = cartRepo;
            _productRepo = productRepo;
        }

        public async Task AddToCart(int customerId, AddToCartDto dto)
        {
            var product = await _productRepo.GetByIdAsync(dto.ProductId);
            if (product == null)
                throw new Exception("Product not found");

            var existingItem = await _cartRepo.GetCartItem(customerId, dto.ProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
                await _cartRepo.UpdateAsync(existingItem);
            }
            else
            {
                var cartItem = new CartItem
                {
                    
                    CustomerId = customerId,
                    ProductId = product.Id,
                    SellerId = product.SellerId,
                    Quantity = dto.Quantity
                };

                await _cartRepo.AddAsync(cartItem);
            }
        }

        public async Task<List<CartItemDto>> GetCart(int customerId)
        {
            var items = await _cartRepo.GetCartItems(customerId);

            return items.Select(x => new CartItemDto
            {
                ProductId = x.ProductId,
                SellerId = x.SellerId,
                Quantity = x.Quantity
            }).ToList();
        }

        public async Task RemoveFromCart(int customerId, int productId)
        {
            var item = await _cartRepo.GetCartItem(customerId, productId);
            if (item == null)
                throw new Exception("Item not found");

            await _cartRepo.DeleteAsync(item);
        }
    }
}
