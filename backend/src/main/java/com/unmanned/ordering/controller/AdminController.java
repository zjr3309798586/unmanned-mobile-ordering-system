package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.AdminDashboard;
import com.unmanned.ordering.model.Product;
import com.unmanned.ordering.request.ProductRequest;
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

    public AdminController(OrderingService orderingService) {
        this.orderingService = orderingService;
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
}
