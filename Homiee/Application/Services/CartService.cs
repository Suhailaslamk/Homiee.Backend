//using Homiee.Application.DTOs;
//using Homiee.Application.Interfaces.IRepository;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Domain.Entities;

//namespace Homiee.Application.Services
//{
//    public class CartService : ICartService
//    {
//        private readonly ICartRepository _cartRepo;
//        private readonly IProductRepository _productRepo;

//        public CartService(ICartRepository cartRepo, IProductRepository productRepo)
//        {
//            _cartRepo = cartRepo;
//            _productRepo = productRepo;
//        }

//        public async Task AddToCart(int customerId, AddToCartDto dto)
//        {
//            var product = await _productRepo.GetByIdAsync(dto.ProductId);
//            if (product == null)
//                throw new Exception("Product not found");

//            var existingItem = await _cartRepo.GetCartItem(customerId, dto.ProductId);

//            if (existingItem != null)
//            {
//                existingItem.Quantity += dto.Quantity;
//                await _cartRepo.UpdateAsync(existingItem);
//            }
//            else
//            {
//                var cartItem = new CartItem
//                {

//                    CustomerId = customerId,
//                    ProductId = product.Id,
//                    SellerId = product.SellerId,
//                    Quantity = dto.Quantity
//                };

//                await _cartRepo.AddAsync(cartItem);
//            }
//        }

//        public async Task<List<CartItemDto>> GetCart(int customerId)
//        {
//            var items = await _cartRepo.GetCartItems(customerId);

//            return items.Select(x => new CartItemDto
//            {
//                ProductId = x.ProductId,
//                SellerId = x.SellerId,
//                Quantity = x.Quantity
//            }).ToList();
//        }

//        public async Task RemoveFromCart(int customerId, int productId)
//        {
//            var item = await _cartRepo.GetCartItem(customerId, productId);
//            if (item == null)
//                throw new Exception("Item not found");

//            await _cartRepo.DeleteAsync(item);
//        }
//    }
//}









using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUserRepository _userRepo;

    public CartService(ICartRepository cartRepo, IProductRepository productRepo, IUserRepository userRepo)
    {
        _cartRepo = cartRepo;
        _productRepo = productRepo;
        _userRepo = userRepo;

    }

    public async Task<ApiResponse<string>> AddToCart(int customerId, AddToCartDto dto)
    {
        var product = await _productRepo.GetByIdAsync(dto.ProductId);
        if (product == null)
            return new ApiResponse<string>(404, "Product not found");

        if (dto.Quantity <= 0)
            return new ApiResponse<string>(400, "Invalid quantity");

        if (product.SellerId == customerId)
            return new ApiResponse<string>(400, "You cannot add your own product to cart");
        var user = await _userRepo.GetByIdAsync(customerId);

        if (user == null)
                        return new ApiResponse<string>(404, "User not found");

        if (user.Role == UserRole.Admin)
            return new ApiResponse<string>(400, "Admin cannot add products to wishlist");
        // ✅ Always fetch existing item first
        var existingItem = await _cartRepo.GetCartItem(customerId, dto.ProductId);

        var existingQty = existingItem?.Quantity ?? 0;
        var totalRequested = existingQty + dto.Quantity;

        // ✅ Single source of truth validation
        if (totalRequested > product.Stock)
        {
            var remainingStock = product.Stock - existingQty;

            if (existingQty > 0)
            {
                return new ApiResponse<string>(
                    400,
                    remainingStock > 0
                        ? $"You already added {existingQty}. Only {remainingStock} more can be added."
                        : $"You already added the maximum available stock ({product.Stock})."
                );
            }

            return new ApiResponse<string>(400, $"Only {product.Stock} items available");
        }

        // ✅ Update or insert
        if (existingItem != null)
        {
            existingItem.Quantity = totalRequested;
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

        return new ApiResponse<string>(200, "Added to cart");
    }
    public async Task<ApiResponse<List<CartItemDto>>> GetCart(int customerId)
    {
        var items = await _cartRepo.GetCartItems(customerId);

        var result = items.Select(x => new CartItemDto
        {
            ProductId = x.ProductId,
            SellerId = x.SellerId,
            Quantity = x.Quantity
        }).ToList();

        return new ApiResponse<List<CartItemDto>>(200, "Cart fetched", result);
    }

    public async Task<ApiResponse<string>> RemoveFromCart(int customerId, int productId)
    {
        var item = await _cartRepo.GetCartItem(customerId, productId);
        if (item == null)
            return new ApiResponse<string>(404, "Item not found");

        await _cartRepo.DeleteAsync(item);

        return new ApiResponse<string>(200, "Removed from cart");
    }
}