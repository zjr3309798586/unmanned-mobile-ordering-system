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

/**
 * 门店相关接口(门店 / Banner / 分类 / 公共券 / 省钱卡 / 我的页 / 个人券)。
 *
 * 共 9 个端点,分两类:
 *   不需要登录:
 *     GET  /api/store                            —— 门店信息
 *     GET  /api/banners                          —— 首页 Banner
 *     GET  /api/categories                       —— 商品分类
 *     GET  /api/coupons                          —— 公共优惠券列表
 *     GET  /api/saving-card/plans                —— 省钱卡方案
 *
 *   需要登录(X-User-Token):
 *     POST /api/saving-card/open                 —— 开通省钱卡
 *     GET  /api/mine                             —— 我的页资料
 *     GET  /api/user/coupons                     —— 我领过的券
 *     POST /api/user/coupons/{couponId}/claim    —— 领券
 */
@RestController
@RequestMapping("/api")
public class StoreController {
    private final OrderingService orderingService;
    private final UserAuthService userAuthService;

    public StoreController(OrderingService orderingService, UserAuthService userAuthService) {
        this.orderingService = orderingService;
        this.userAuthService = userAuthService;
    }

    /** 门店基础信息,首页 / 点餐页 / 购物车结算页 都会用到。 */
    @GetMapping("/store")
    public ApiResponse<Store> getStore() {
        return ApiResponse.ok(orderingService.getStore());
    }

    /** 首页 Banner,只返回 enabled=1 的。 */
    @GetMapping("/banners")
    public ApiResponse<List<Banner>> listBanners() {
        return ApiResponse.ok(orderingService.listBanners());
    }

    /** 商品分类,点餐页左侧分类栏使用。 */
    @GetMapping("/categories")
    public ApiResponse<List<Category>> listCategories() {
        return ApiResponse.ok(orderingService.listCategories());
    }

    /** 公开优惠券列表,省钱卡页和首页优惠提示使用。 */
    @GetMapping("/coupons")
    public ApiResponse<List<Coupon>> listCoupons() {
        return ApiResponse.ok(orderingService.listCoupons());
    }

    /** 省钱卡套餐(月卡 / 季卡 / 年卡)。 */
    @GetMapping("/saving-card/plans")
    public ApiResponse<List<SavingCardPlan>> listSavingCardPlans() {
        return ApiResponse.ok(orderingService.listSavingCardPlans());
    }

    /**
     * 开通省钱卡,需要登录。
     * 当前实现是把用户 member_level 改为"省钱卡会员"(简化:没接支付)。
     */
    @PostMapping("/saving-card/open")
    public ApiResponse<UserProfile> openSavingCard(
            @RequestHeader(value = "X-User-Token", required = false) String token) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.openSavingCard(user.getId()));
    }

    /** "我的"页读取当前用户资料(积分 / 节省金额 / 会员等级 / 券数量)。 */
    @GetMapping("/mine")
    public ApiResponse<UserProfile> getMine(@RequestHeader(value = "X-User-Token", required = false) String token) {
        return ApiResponse.ok(userAuthService.getProfile(token));
    }

    /** 当前用户已领取的优惠券,购物车选券抽屉使用。 */
    @GetMapping("/user/coupons")
    public ApiResponse<List<UserCoupon>> listUserCoupons(
            @RequestHeader(value = "X-User-Token", required = false) String token) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.listUserCoupons(user.getId()));
    }

    /**
     * 领取优惠券。
     * 业务规则(在 OrderingService.claimCoupon 里):必须先开通省钱卡才能领券。
     */
    @PostMapping("/user/coupons/{couponId}/claim")
    public ApiResponse<UserCoupon> claimCoupon(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String couponId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.claimCoupon(user.getId(), couponId));
    }
}
