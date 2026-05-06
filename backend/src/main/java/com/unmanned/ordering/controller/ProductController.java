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

    // 前台点餐页调用这个接口读取商品列表。
    // categoryId 和 keyword 都是可选参数：
    // 1. categoryId 用来按分类筛选商品。
    // 2. keyword 用来按关键词搜索商品。
    @GetMapping
    public ApiResponse<List<Product>> listProducts(
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(orderingService.listProducts(categoryId, keyword));
    }

    // 商品详情页调用这个接口。
    // 路径里的 productId 表示商品编号，例如 /api/products/P-1001。
    @GetMapping("/{productId}")
    public ApiResponse<Product> getProduct(@PathVariable String productId) {
        return ApiResponse.ok(orderingService.getProduct(productId));
    }
}
