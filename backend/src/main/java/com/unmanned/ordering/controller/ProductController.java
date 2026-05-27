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

/**
 * 前台商品接口(不需要登录,任何人都能浏览)。
 *
 * 共 2 个端点:
 *   GET /api/products              —— 商品列表(支持分类筛选 + 关键词搜索)
 *   GET /api/products/{productId}  —— 商品详情
 *
 * 后台商品管理(增/改/下架)在 AdminController。
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final OrderingService orderingService;

    public ProductController(OrderingService orderingService) {
        this.orderingService = orderingService;
    }

    /**
     * 前台点餐页商品列表。
     * categoryId 和 keyword 都是可选条件:
     *   - 都不传 → 返回所有上架商品
     *   - 只传 categoryId → 按分类筛选
     *   - 只传 keyword → 按商品名模糊匹配
     *   - 同时传 → 二者并用
     */
    @GetMapping
    public ApiResponse<List<Product>> listProducts(
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(orderingService.listProducts(categoryId, keyword));
    }

    /**
     * 商品详情页。
     * 路径里的 productId 表示商品编号(如 /api/products/P-1001)。
     * 下架商品在这里查不到,返回 404。
     */
    @GetMapping("/{productId}")
    public ApiResponse<Product> getProduct(@PathVariable String productId) {
        return ApiResponse.ok(orderingService.getProduct(productId));
    }
}
