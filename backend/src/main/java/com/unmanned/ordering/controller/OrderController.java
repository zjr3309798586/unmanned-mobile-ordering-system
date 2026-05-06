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

    // 查询当前登录用户的订单列表。
    // status 是可选筛选条件，例如 WAITING_PICKUP、COMPLETED、CANCELED。
    @GetMapping
    public ApiResponse<List<Order>> listOrders(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @RequestParam(required = false) String status) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.listOrders(user.getId(), status));
    }

    // 查询当前用户的某一个订单详情。
    // 后端会同时校验：这个订单必须属于当前登录用户。
    @GetMapping("/{orderId}")
    public ApiResponse<Order> getOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String orderId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.getOrder(user.getId(), orderId));
    }

    // 提交订单。
    // 前端只提交取餐方式、优惠券、桌号、备注。
    // 商品清单不由前端传，而是后端直接读取当前用户购物车，避免前端篡改价格。
    @PostMapping
    public ApiResponse<Order> createOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @Valid @RequestBody CreateOrderRequest request) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.created(orderingService.createOrder(user.getId(), request));
    }

    // 用户取消自己的订单。
    // 已完成订单不能取消，具体判断在 OrderingService.cancelOrder 中。
    @PatchMapping("/{orderId}/cancel")
    public ApiResponse<Order> cancelOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String orderId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.cancelOrder(user.getId(), orderId));
    }

    // 再来一单。
    // 后端会把历史订单里的商品重新加入当前用户购物车。
    @PostMapping("/{orderId}/repeat")
    public ApiResponse<CartSummary> repeatOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String orderId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.repeatOrder(user.getId(), orderId));
    }
}
