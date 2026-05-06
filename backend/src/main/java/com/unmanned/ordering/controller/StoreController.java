package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.Banner;
import com.unmanned.ordering.model.Category;
import com.unmanned.ordering.model.Coupon;
import com.unmanned.ordering.model.SavingCardPlan;
import com.unmanned.ordering.model.Store;
import com.unmanned.ordering.model.User;
import com.unmanned.ordering.model.UserCoupon;
import com.unmanned.ordering.model.UserProfile;
import com.unmanned.ordering.service.OrderingService;
import com.unmanned.ordering.service.UserAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StoreController {
    private final OrderingService orderingService;
    private final UserAuthService userAuthService;

    public StoreController(OrderingService orderingService, UserAuthService userAuthService) {
        this.orderingService = orderingService;
        this.userAuthService = userAuthService;
    }

    // 查询门店基础信息，首页、点餐页、提交订单页都会用到。
    @GetMapping("/store")
    public ApiResponse<Store> getStore() {
        return ApiResponse.ok(orderingService.getStore());
    }

    // 查询首页 Banner，只返回启用状态的 Banner。
    @GetMapping("/banners")
    public ApiResponse<List<Banner>> listBanners() {
        return ApiResponse.ok(orderingService.listBanners());
    }

    // 查询商品分类，点餐页左侧分类栏使用。
    @GetMapping("/categories")
    public ApiResponse<List<Category>> listCategories() {
        return ApiResponse.ok(orderingService.listCategories());
    }

    // 查询公开优惠券列表，省钱卡页和首页优惠提示会使用。
    @GetMapping("/coupons")
    public ApiResponse<List<Coupon>> listCoupons() {
        return ApiResponse.ok(orderingService.listCoupons());
    }

    // 查询省钱卡套餐配置。
    @GetMapping("/saving-card/plans")
    public ApiResponse<List<SavingCardPlan>> listSavingCardPlans() {
        return ApiResponse.ok(orderingService.listSavingCardPlans());
    }

    // 开通省钱卡，需要用户先登录。
    // 当前实现是把用户会员等级更新为“省钱卡会员”。
    @PostMapping("/saving-card/open")
    public ApiResponse<UserProfile> openSavingCard(
            @RequestHeader(value = "X-User-Token", required = false) String token) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.openSavingCard(user.getId()));
    }

    // 我的页读取当前用户资料。
    @GetMapping("/mine")
    public ApiResponse<UserProfile> getMine(@RequestHeader(value = "X-User-Token", required = false) String token) {
        return ApiResponse.ok(userAuthService.getProfile(token));
    }

    // 查询当前用户已经领取的优惠券。
    @GetMapping("/user/coupons")
    public ApiResponse<List<UserCoupon>> listUserCoupons(
            @RequestHeader(value = "X-User-Token", required = false) String token) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.listUserCoupons(user.getId()));
    }

    // 领取优惠券。
    // 业务规则：必须先开通省钱卡，才能领取优惠券。
    @PostMapping("/user/coupons/{couponId}/claim")
    public ApiResponse<UserCoupon> claimCoupon(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String couponId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.claimCoupon(user.getId(), couponId));
    }
}
