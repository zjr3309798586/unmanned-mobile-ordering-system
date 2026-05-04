package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.AdminDashboard;
import com.unmanned.ordering.model.AdminSession;
import com.unmanned.ordering.model.Category;
import com.unmanned.ordering.model.Coupon;
import com.unmanned.ordering.model.Order;
import com.unmanned.ordering.model.Product;
import com.unmanned.ordering.model.UserProfile;
import com.unmanned.ordering.request.AdminLoginRequest;
import com.unmanned.ordering.request.CategoryRequest;
import com.unmanned.ordering.request.CouponRequest;
import com.unmanned.ordering.request.ProductRequest;
import com.unmanned.ordering.service.AdminAuthService;
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
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final OrderingService orderingService;
    private final AdminAuthService adminAuthService;

    public AdminController(OrderingService orderingService, AdminAuthService adminAuthService) {
        this.orderingService = orderingService;
        this.adminAuthService = adminAuthService;
    }

    @PostMapping("/login")
    public ApiResponse<AdminSession> login(@Valid @RequestBody AdminLoginRequest request) {
        return ApiResponse.ok(adminAuthService.login(request));
    }

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboard> getDashboard() {
        return ApiResponse.ok(orderingService.getDashboard());
    }

    @GetMapping("/products")
    public ApiResponse<List<Product>> listProducts() {
        return ApiResponse.ok(orderingService.listAllProductsForAdmin());
    }

    @PostMapping("/products")
    public ApiResponse<Product> createProduct(@Valid @RequestBody ProductRequest request) {
        return ApiResponse.created(orderingService.createProduct(request));
    }

    @PatchMapping("/products/{productId}")
    public ApiResponse<Product> updateProduct(
            @PathVariable String productId,
            @Valid @RequestBody ProductRequest request) {
        return ApiResponse.ok(orderingService.updateProduct(productId, request));
    }

    @DeleteMapping("/products/{productId}")
    public ApiResponse<Product> disableProduct(@PathVariable String productId) {
        return ApiResponse.ok(orderingService.disableProduct(productId));
    }

    @GetMapping("/categories")
    public ApiResponse<List<Category>> listCategories() {
        return ApiResponse.ok(orderingService.listAllCategoriesForAdmin());
    }

    @PostMapping("/categories")
    public ApiResponse<Category> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.created(orderingService.createCategory(request));
    }

    @PatchMapping("/categories/{categoryId}")
    public ApiResponse<Category> updateCategory(
            @PathVariable String categoryId,
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(orderingService.updateCategory(categoryId, request));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ApiResponse<Category> deleteCategory(@PathVariable String categoryId) {
        return ApiResponse.ok(orderingService.deleteCategory(categoryId));
    }

    @GetMapping("/coupons")
    public ApiResponse<List<Coupon>> listCoupons() {
        return ApiResponse.ok(orderingService.listAllCouponsForAdmin());
    }

    @PostMapping("/coupons")
    public ApiResponse<Coupon> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ApiResponse.created(orderingService.createCoupon(request));
    }

    @PatchMapping("/coupons/{couponId}")
    public ApiResponse<Coupon> updateCoupon(
            @PathVariable String couponId,
            @Valid @RequestBody CouponRequest request) {
        return ApiResponse.ok(orderingService.updateCoupon(couponId, request));
    }

    @DeleteMapping("/coupons/{couponId}")
    public ApiResponse<Coupon> disableCoupon(@PathVariable String couponId) {
        return ApiResponse.ok(orderingService.disableCoupon(couponId));
    }

    @GetMapping("/orders")
    public ApiResponse<List<Order>> listOrders() {
        return ApiResponse.ok(orderingService.listOrdersForAdmin(null));
    }

    @PatchMapping("/orders/{orderId}/complete")
    public ApiResponse<Order> completeOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderingService.completeOrder(orderId));
    }

    @PatchMapping("/orders/{orderId}/cancel")
    public ApiResponse<Order> cancelOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderingService.cancelOrderForAdmin(orderId));
    }

    @GetMapping("/users")
    public ApiResponse<List<UserProfile>> listUsers() {
        return ApiResponse.ok(orderingService.listUsersForAdmin());
    }
}
