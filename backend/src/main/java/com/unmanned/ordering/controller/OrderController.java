package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.CartSummary;
import com.unmanned.ordering.model.Order;
import com.unmanned.ordering.request.CreateOrderRequest;
import com.unmanned.ordering.service.OrderingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderingService orderingService;

    public OrderController(OrderingService orderingService) {
        this.orderingService = orderingService;
    }

    @GetMapping
    public ApiResponse<List<Order>> listOrders(@RequestParam(required = false) String status) {
        return ApiResponse.ok(orderingService.listOrders(status));
    }

    @GetMapping("/{orderId}")
    public ApiResponse<Order> getOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderingService.getOrder(orderId));
    }

    @PostMapping
    public ApiResponse<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.created(orderingService.createOrder(request));
    }

    @PatchMapping("/{orderId}/cancel")
    public ApiResponse<Order> cancelOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderingService.cancelOrder(orderId));
    }

    @PostMapping("/{orderId}/repeat")
    public ApiResponse<CartSummary> repeatOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderingService.repeatOrder(orderId));
    }
}
