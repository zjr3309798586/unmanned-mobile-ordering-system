package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.Category;
import com.unmanned.ordering.model.Coupon;
import com.unmanned.ordering.model.SavingCardPlan;
import com.unmanned.ordering.model.Store;
import com.unmanned.ordering.model.UserProfile;
import com.unmanned.ordering.service.OrderingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StoreController {
    private final OrderingService orderingService;

    public StoreController(OrderingService orderingService) {
        this.orderingService = orderingService;
    }

    @GetMapping("/store")
    public ApiResponse<Store> getStore() {
        return ApiResponse.ok(orderingService.getStore());
    }

    @GetMapping("/categories")
    public ApiResponse<List<Category>> listCategories() {
        return ApiResponse.ok(orderingService.listCategories());
    }

    @GetMapping("/coupons")
    public ApiResponse<List<Coupon>> listCoupons() {
        return ApiResponse.ok(orderingService.listCoupons());
    }

    @GetMapping("/saving-card/plans")
    public ApiResponse<List<SavingCardPlan>> listSavingCardPlans() {
        return ApiResponse.ok(orderingService.listSavingCardPlans());
    }

    @GetMapping("/mine")
    public ApiResponse<UserProfile> getMine() {
        return ApiResponse.ok(orderingService.getUserProfile());
    }
}
