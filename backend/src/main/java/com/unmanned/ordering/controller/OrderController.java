package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.CartSummary;
import com.unmanned.ordering.model.Order;
import com.unmanned.ordering.model.User;
import com.unmanned.ordering.request.CreateOrderRequest;
import com.unmanned.ordering.service.OrderingService;
import com.unmanned.ordering.service.UserAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderingService orderingService;
    private final UserAuthService userAuthService;

    public OrderController(OrderingService orderingService, UserAuthService userAuthService) {
        this.orderingService = orderingService;
        this.userAuthService = userAuthService;
    }

    @GetMapping
    public ApiResponse<List<Order>> listOrders(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @RequestParam(required = false) String status) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.listOrders(user.getId(), status));
    }

    @GetMapping("/{orderId}")
    public ApiResponse<Order> getOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String orderId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.getOrder(user.getId(), orderId));
    }

    @PostMapping
    public ApiResponse<Order> createOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @Valid @RequestBody CreateOrderRequest request) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.created(orderingService.createOrder(user.getId(), request));
    }

    @PatchMapping("/{orderId}/cancel")
    public ApiResponse<Order> cancelOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String orderId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.cancelOrder(user.getId(), orderId));
    }

    @PostMapping("/{orderId}/repeat")
    public ApiResponse<CartSummary> repeatOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String orderId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.repeatOrder(user.getId(), orderId));
    }
}
