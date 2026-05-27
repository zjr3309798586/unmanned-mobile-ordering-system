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

/**
 * 订单相关接口(全部需要登录)。
 *
 * 共 5 个端点:
 *   GET   /api/orders                  —— 订单列表(可按状态过滤)
 *   GET   /api/orders/{orderId}        —— 订单详情
 *   POST  /api/orders                  —— 提交订单
 *   PATCH /api/orders/{orderId}/cancel —— 用户取消订单
 *   POST  /api/orders/{orderId}/repeat —— 再来一单
 *
 * 后台店员的"完成订单 / 取消订单"在 AdminController。
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderingService orderingService;
    private final UserAuthService userAuthService;

    public OrderController(OrderingService orderingService, UserAuthService userAuthService) {
        this.orderingService = orderingService;
        this.userAuthService = userAuthService;
    }

    /**
     * 当前用户的订单列表。
     * status 可选筛选:WAITING_PICKUP(待取餐) / COMPLETED(已完成) / CANCELED(已取消)。
     */
    @GetMapping
    public ApiResponse<List<Order>> listOrders(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @RequestParam(required = false) String status) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.listOrders(user.getId(), status));
    }

    /**
     * 订单详情。
     * Service 层会校验:订单必须属于当前用户,防止越权查别人的订单。
     */
    @GetMapping("/{orderId}")
    public ApiResponse<Order> getOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String orderId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.getOrder(user.getId(), orderId));
    }

    /**
     * 提交订单。
     * 前端只提交取餐方式 / 优惠券 / 桌号 / 备注,
     * 商品清单由后端直接读取当前用户购物车(防止前端篡改价格)。
     */
    @PostMapping
    public ApiResponse<Order> createOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @Valid @RequestBody CreateOrderRequest request) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.created(orderingService.createOrder(user.getId(), request));
    }

    /**
     * 用户主动取消订单。
     * 已完成订单不能取消(详见 OrderingService.cancelOrder)。
     */
    @PatchMapping("/{orderId}/cancel")
    public ApiResponse<Order> cancelOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String orderId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.cancelOrder(user.getId(), orderId));
    }

    /**
     * 再来一单:把历史订单里的商品重新加入购物车,而不是直接复制订单。
     * 用户可以在购物车里调整数量或规格后再确认提交。
     */
    @PostMapping("/{orderId}/repeat")
    public ApiResponse<CartSummary> repeatOrder(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String orderId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.repeatOrder(user.getId(), orderId));
    }
}
