package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.CartSummary;
import com.unmanned.ordering.request.AddCartItemRequest;
import com.unmanned.ordering.request.UpdateCartItemRequest;
import com.unmanned.ordering.service.OrderingService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final OrderingService orderingService;

    public CartController(OrderingService orderingService) {
        this.orderingService = orderingService;
    }

    @GetMapping
    public ApiResponse<CartSummary> getCart() {
        return ApiResponse.ok(orderingService.getCartSummary());
    }

    @PostMapping("/items")
    public ApiResponse<CartSummary> addCartItem(@Valid @RequestBody AddCartItemRequest request) {
        return ApiResponse.created(orderingService.addCartItem(request));
    }

    @PatchMapping("/items/{itemId}")
    public ApiResponse<CartSummary> updateCartItem(
            @PathVariable String itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        return ApiResponse.ok(orderingService.updateCartItem(itemId, request.getQuantity()));
    }

    @DeleteMapping("/items/{itemId}")
    public ApiResponse<CartSummary> deleteCartItem(@PathVariable String itemId) {
        return ApiResponse.ok(orderingService.deleteCartItem(itemId));
    }

    @DeleteMapping
    public ApiResponse<CartSummary> clearCart() {
        return ApiResponse.ok(orderingService.clearCart());
    }
}
