package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.Product;
import com.unmanned.ordering.service.OrderingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final OrderingService orderingService;

    public ProductController(OrderingService orderingService) {
        this.orderingService = orderingService;
    }

    @GetMapping
    public ApiResponse<List<Product>> listProducts(
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(orderingService.listProducts(categoryId, keyword));
    }

    @GetMapping("/{productId}")
    public ApiResponse<Product> getProduct(@PathVariable String productId) {
        return ApiResponse.ok(orderingService.getProduct(productId));
    }
}
