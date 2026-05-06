package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.AdminDashboard;
import com.unmanned.ordering.model.AdminSession;
import com.unmanned.ordering.model.Banner;
import com.unmanned.ordering.model.Category;
import com.unmanned.ordering.model.Coupon;
import com.unmanned.ordering.model.Order;
import com.unmanned.ordering.model.Product;
import com.unmanned.ordering.model.UserProfile;
import com.unmanned.ordering.request.AdminLoginRequest;
import com.unmanned.ordering.request.BannerRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

// 后台管理端接口。后台 HTML 页面所有“增删改查”请求，基本都会进这个类。
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final OrderingService orderingService;
    private final AdminAuthService adminAuthService;

    public AdminController(OrderingService orderingService, AdminAuthService adminAuthService) {
        this.orderingService = orderingService;
        this.adminAuthService = adminAuthService;
    }

    // 后台管理员登录。前端提交账号密码后，会拿到一个管理员 token。
    @PostMapping("/login")
    public ApiResponse<AdminSession> login(@Valid @RequestBody AdminLoginRequest request) {
        return ApiResponse.ok(adminAuthService.login(request));
    }

    // 后台首页数据看板：订单数、商品数、用户数、销售额等统计数据。
    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboard> getDashboard() {
        return ApiResponse.ok(orderingService.getDashboard());
    }

    // Banner 管理：后台查看所有 Banner，包括已下架的 Banner。
    @GetMapping("/banners")
    public ApiResponse<List<Banner>> listBanners() {
        return ApiResponse.ok(orderingService.listAllBannersForAdmin());
    }

    // 新增 Banner。@Valid 会检查 BannerRequest 里的必填字段。
    @PostMapping("/banners")
    public ApiResponse<Banner> createBanner(@Valid @RequestBody BannerRequest request) {
        return ApiResponse.created(orderingService.createBanner(request));
    }

    // 修改 Banner。bannerId 来自浏览器地址，request 是页面表单提交的新内容。
    @PatchMapping("/banners/{bannerId}")
    public ApiResponse<Banner> updateBanner(
            @PathVariable String bannerId,
            @Valid @RequestBody BannerRequest request) {
        return ApiResponse.ok(orderingService.updateBanner(bannerId, request));
    }

    // 删除 Banner 这里采用“软删除”：把 enabled 改成 false，数据还留在数据库里。
    @DeleteMapping("/banners/{bannerId}")
    public ApiResponse<Banner> disableBanner(@PathVariable String bannerId) {
        return ApiResponse.ok(orderingService.disableBanner(bannerId));
    }

    // 后台上传商品图 / Banner 图。图片会保存到项目根目录的 images/uploads 下面。
    @PostMapping("/uploads/images")
    public ApiResponse<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return ApiResponse.fail(400, "请选择图片文件");
        }
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase(Locale.ROOT) : ".png";
        if (!ext.matches("\\.(png|jpg|jpeg|gif|webp|svg)$")) {
            return ApiResponse.fail(400, "仅支持 png、jpg、jpeg、gif、webp、svg 图片");
        }
        // Spring Boot 是从 backend 目录启动的，图片需要放到父目录 images 下，前台和后台才能访问。
        Path backendDir = Paths.get(System.getProperty("user.dir")).toAbsolutePath();
        Path frontendDir = backendDir.getParent();
        Path uploadDir = (frontendDir == null ? backendDir : frontendDir).resolve("images").resolve("uploads");
        Files.createDirectories(uploadDir);
        String filename = "img-" + UUID.randomUUID().toString().replace("-", "") + ext;
        Files.copy(file.getInputStream(), uploadDir.resolve(filename));
        return ApiResponse.ok(Map.of("path", "/images/uploads/" + filename));
    }

    // 商品管理：后台需要看到所有商品，包括已经下架的商品。
    @GetMapping("/products")
    public ApiResponse<List<Product>> listProducts() {
        return ApiResponse.ok(orderingService.listAllProductsForAdmin());
    }

    // 新增商品。
    @PostMapping("/products")
    public ApiResponse<Product> createProduct(@Valid @RequestBody ProductRequest request) {
        return ApiResponse.created(orderingService.createProduct(request));
    }

    // 修改商品。
    @PatchMapping("/products/{productId}")
    public ApiResponse<Product> updateProduct(
            @PathVariable String productId,
            @Valid @RequestBody ProductRequest request) {
        return ApiResponse.ok(orderingService.updateProduct(productId, request));
    }

    // 下架商品，同样是软删除，避免历史订单找不到商品信息。
    @DeleteMapping("/products/{productId}")
    public ApiResponse<Product> disableProduct(@PathVariable String productId) {
        return ApiResponse.ok(orderingService.disableProduct(productId));
    }

    // 分类管理：点餐页左侧分类来自这里。
    @GetMapping("/categories")
    public ApiResponse<List<Category>> listCategories() {
        return ApiResponse.ok(orderingService.listAllCategoriesForAdmin());
    }

    // 新增分类。
    @PostMapping("/categories")
    public ApiResponse<Category> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.created(orderingService.createCategory(request));
    }

    // 修改分类名称和排序。
    @PatchMapping("/categories/{categoryId}")
    public ApiResponse<Category> updateCategory(
            @PathVariable String categoryId,
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(orderingService.updateCategory(categoryId, request));
    }

    // 删除分类。Service 层会检查分类下是否还有商品，避免误删。
    @DeleteMapping("/categories/{categoryId}")
    public ApiResponse<Category> deleteCategory(@PathVariable String categoryId) {
        return ApiResponse.ok(orderingService.deleteCategory(categoryId));
    }

    // 优惠券管理：后台维护券规则，前台用户购买省钱卡后才能领取。
    @GetMapping("/coupons")
    public ApiResponse<List<Coupon>> listCoupons() {
        return ApiResponse.ok(orderingService.listAllCouponsForAdmin());
    }

    // 新增优惠券。
    @PostMapping("/coupons")
    public ApiResponse<Coupon> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ApiResponse.created(orderingService.createCoupon(request));
    }

    // 修改优惠券，比如满减门槛、优惠金额、有效期。
    @PatchMapping("/coupons/{couponId}")
    public ApiResponse<Coupon> updateCoupon(
            @PathVariable String couponId,
            @Valid @RequestBody CouponRequest request) {
        return ApiResponse.ok(orderingService.updateCoupon(couponId, request));
    }

    // 下架优惠券。已经领取的券是否可用，还会在下单时再次校验。
    @DeleteMapping("/coupons/{couponId}")
    public ApiResponse<Coupon> disableCoupon(@PathVariable String couponId) {
        return ApiResponse.ok(orderingService.disableCoupon(couponId));
    }

    // 订单管理：后台查看所有用户提交的订单。
    @GetMapping("/orders")
    public ApiResponse<List<Order>> listOrders() {
        return ApiResponse.ok(orderingService.listOrdersForAdmin(null));
    }

    // 后台把订单改为已完成。
    @PatchMapping("/orders/{orderId}/complete")
    public ApiResponse<Order> completeOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderingService.completeOrder(orderId));
    }

    // 后台取消订单。Service 层会回滚销量、优惠券和用户积分统计。
    @PatchMapping("/orders/{orderId}/cancel")
    public ApiResponse<Order> cancelOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderingService.cancelOrderForAdmin(orderId));
    }

    // 用户管理：后台查看用户昵称、会员等级、积分、优惠券数量等资料。
    @GetMapping("/users")
   public ApiResponse<List<UserProfile>> listUsers() {
        return ApiResponse.ok(orderingService.listUsersForAdmin());
    }
}
