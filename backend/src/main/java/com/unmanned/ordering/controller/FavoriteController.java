package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.Product;
import com.unmanned.ordering.model.User;
import com.unmanned.ordering.service.OrderingService;
import com.unmanned.ordering.service.UserAuthService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 口味收藏接口。
 *
 * 前台 H5 和微信小程序共用这组接口:
 *   GET    /api/favorites                    查询当前用户收藏商品
 *   GET    /api/favorites/{productId}/status 查询某商品是否已收藏
 *   POST   /api/favorites/{productId}        收藏商品
 *   DELETE /api/favorites/{productId}        取消收藏
 */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
    private final OrderingService orderingService;
    private final UserAuthService userAuthService;

    public FavoriteController(OrderingService orderingService, UserAuthService userAuthService) {
        this.orderingService = orderingService;
        this.userAuthService = userAuthService;
    }

    @GetMapping
    public ApiResponse<List<Product>> listFavorites(
            @RequestHeader(value = "X-User-Token", required = false) String token) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.listFavorites(user.getId()));
    }

    @GetMapping("/{productId}/status")
    public ApiResponse<Map<String, Boolean>> getFavoriteStatus(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String productId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(Map.of("favorite", orderingService.isFavorite(user.getId(), productId)));
    }

    @PostMapping("/{productId}")
    public ApiResponse<List<Product>> addFavorite(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String productId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.created(orderingService.addFavorite(user.getId(), productId));
    }

    @DeleteMapping("/{productId}")
    public ApiResponse<List<Product>> deleteFavorite(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String productId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.deleteFavorite(user.getId(), productId));
    }
}
