package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.CartSummary;
import com.unmanned.ordering.model.User;
import com.unmanned.ordering.request.AddCartItemRequest;
import com.unmanned.ordering.request.UpdateCartItemRequest;
import com.unmanned.ordering.service.OrderingService;
import com.unmanned.ordering.service.UserAuthService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final OrderingService orderingService;
    private final UserAuthService userAuthService;

    public CartController(OrderingService orderingService, UserAuthService userAuthService) {
        this.orderingService = orderingService;
        this.userAuthService = userAuthService;
    }

    @GetMapping
    public ApiResponse<CartSummary> getCart(@RequestHeader(value = "X-User-Token", required = false) String token) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.getCartSummary(user.getId()));
    }

    @PostMapping("/items")
    public ApiResponse<CartSummary> addCartItem(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @Valid @RequestBody AddCartItemRequest request) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.created(orderingService.addCartItem(user.getId(), request));
    }

    @PatchMapping("/items/{itemId}")
    public ApiResponse<CartSummary> updateCartItem(
            @PathVariable String itemId,
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @Valid @RequestBody UpdateCartItemRequest request) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.updateCartItem(user.getId(), itemId, request.getQuantity()));
    }

    @DeleteMapping("/items/{itemId}")
    public ApiResponse<CartSummary> deleteCartItem(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String itemId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.deleteCartItem(user.getId(), itemId));
    }

    @DeleteMapping
    public ApiResponse<CartSummary> clearCart(@RequestHeader(value = "X-User-Token", required = false) String token) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.clearCart(user.getId()));
    }
}
