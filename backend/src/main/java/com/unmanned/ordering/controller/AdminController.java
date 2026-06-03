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

/**
 * 后台管理端接口集合。
 *
 * 全部前缀 /api/admin/**,除 /login 外所有端点都被 AdminAuthInterceptor 拦截,
 * 必须带 X-Admin-Token 才能访问。
 *
 * 管理领域:
 *   1. 登录              POST  /api/admin/login
 *   2. 数据看板          GET   /api/admin/dashboard
 *   3. Banner 管理       /api/admin/banners(增/改/软删)
 *   4. 图片上传          POST  /api/admin/uploads/images
 *   5. 商品管理          /api/admin/products(增/改/软删)
 *   6. 分类管理          /api/admin/categories(增/改/删)
 *   7. 优惠券管理        /api/admin/coupons(增/改/软删)
 *   8. 订单管理          /api/admin/orders(查/完成/取消)
 *   9. 用户管理          GET   /api/admin/users
 *
 * 删除策略:商品 / Banner / 优惠券 都用"软删除"(把 enabled 置 false),
 * 避免破坏历史订单数据;只有分类是真删,且要求该分类下没有商品。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final OrderingService orderingService;
    private final AdminAuthService adminAuthService;

    public AdminController(OrderingService orderingService, AdminAuthService adminAuthService) {
        this.orderingService = orderingService;
        this.adminAuthService = adminAuthService;
    }

    /** 后台管理员登录。成功后返回管理员 token,后续接口必须带 X-Admin-Token 请求头。 */
    @PostMapping("/login")
    public ApiResponse<AdminSession> login(@Valid @RequestBody AdminLoginRequest request) {
        return ApiResponse.ok(adminAuthService.login(request));
    }

    /** 数据看板:商品数 / 订单数 / 购物车项数 / 销售总额。 */
    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboard> getDashboard() {
        return ApiResponse.ok(orderingService.getDashboard());
    }

    // ===== Banner 管理 =====

    /** Banner 列表:后台需要看到所有 Banner,包括已下架的。 */
    @GetMapping("/banners")
    public ApiResponse<List<Banner>> listBanners() {
        return ApiResponse.ok(orderingService.listAllBannersForAdmin());
    }

    /** 新增 Banner。@Valid 会校验 BannerRequest 必填字段。 */
    @PostMapping("/banners")
    public ApiResponse<Banner> createBanner(@Valid @RequestBody BannerRequest request) {
        return ApiResponse.created(orderingService.createBanner(request));
    }

    /** 修改 Banner(整体覆盖)。 */
    @PatchMapping("/banners/{bannerId}")
    public ApiResponse<Banner> updateBanner(
            @PathVariable String bannerId,
            @Valid @RequestBody BannerRequest request) {
        return ApiResponse.ok(orderingService.updateBanner(bannerId, request));
    }

    /** 软删除 Banner:把 enabled 置 false,数据仍保留。 */
    @DeleteMapping("/banners/{bannerId}")
    public ApiResponse<Banner> disableBanner(@PathVariable String bannerId) {
        return ApiResponse.ok(orderingService.disableBanner(bannerId));
    }

    /**
     * 后台上传商品图 / Banner 图。
     *
     * 上传到 h5/images/uploads/ 下,文件名格式 img-{随机串}.{ext}。
     * 上传成功后返回 { path: "/images/uploads/img-xxx.png" },前端把这个路径
     * 填到商品/Banner 的 image 字段保存。
     * 本地开发时会同步一份到 miniprogram/images/uploads/,方便微信开发者工具预览。
     *
     * 仅允许 png / jpg / jpeg / gif / webp / svg 6 种格式。
     */
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
        Path cwd = Paths.get(System.getProperty("user.dir")).toAbsolutePath();
        Path projectRoot = Files.exists(cwd.resolve("h5")) ? cwd : cwd.getParent();
        if (projectRoot == null) {
            projectRoot = cwd;
        }
        Path uploadDir = projectRoot.resolve("h5").resolve("images").resolve("uploads");
        Files.createDirectories(uploadDir);
        String filename = "img-" + UUID.randomUUID().toString().replace("-", "") + ext;
        byte[] bytes = file.getBytes();
        Files.write(uploadDir.resolve(filename), bytes);
        Path miniprogramImagesDir = projectRoot.resolve("miniprogram").resolve("images");
        if (Files.exists(miniprogramImagesDir)) {
            Path miniprogramUploadDir = miniprogramImagesDir.resolve("uploads");
            Files.createDirectories(miniprogramUploadDir);
            Files.write(miniprogramUploadDir.resolve(filename), bytes);
        }
        return ApiResponse.ok(Map.of("path", "/images/uploads/" + filename));
    }

    // ===== 商品管理 =====

    /** 商品列表:后台需要看到所有商品,包括已下架的。 */
    @GetMapping("/products")
    public ApiResponse<List<Product>> listProducts() {
        return ApiResponse.ok(orderingService.listAllProductsForAdmin());
    }

    /** 新增商品。 */
    @PostMapping("/products")
    public ApiResponse<Product> createProduct(@Valid @RequestBody ProductRequest request) {
        return ApiResponse.created(orderingService.createProduct(request));
    }

    /** 修改商品(整体覆盖)。 */
    @PatchMapping("/products/{productId}")
    public ApiResponse<Product> updateProduct(
            @PathVariable String productId,
            @Valid @RequestBody ProductRequest request) {
        return ApiResponse.ok(orderingService.updateProduct(productId, request));
    }

    /** 软删除商品。这样历史订单仍能找到商品信息(名字、规格、当时价格)。 */
    @DeleteMapping("/products/{productId}")
    public ApiResponse<Product> disableProduct(@PathVariable String productId) {
        return ApiResponse.ok(orderingService.disableProduct(productId));
    }

    // ===== 分类管理 =====

    /** 分类列表。前后台共用,因为分类无"下架"概念。 */
    @GetMapping("/categories")
    public ApiResponse<List<Category>> listCategories() {
        return ApiResponse.ok(orderingService.listAllCategoriesForAdmin());
    }

    /** 新增分类。 */
    @PostMapping("/categories")
    public ApiResponse<Category> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.created(orderingService.createCategory(request));
    }

    /** 修改分类名称和排序。 */
    @PatchMapping("/categories/{categoryId}")
    public ApiResponse<Category> updateCategory(
            @PathVariable String categoryId,
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(orderingService.updateCategory(categoryId, request));
    }

    /** 删除分类。Service 层会检查:分类下还有商品时禁止删除。 */
    @DeleteMapping("/categories/{categoryId}")
    public ApiResponse<Category> deleteCategory(@PathVariable String categoryId) {
        return ApiResponse.ok(orderingService.deleteCategory(categoryId));
    }

    // ===== 优惠券管理 =====

    /** 优惠券列表(含下架的)。后台维护券规则,用户买省钱卡后才能领。 */
    @GetMapping("/coupons")
    public ApiResponse<List<Coupon>> listCoupons() {
        return ApiResponse.ok(orderingService.listAllCouponsForAdmin());
    }

    /** 新增优惠券。 */
    @PostMapping("/coupons")
    public ApiResponse<Coupon> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ApiResponse.created(orderingService.createCoupon(request));
    }

    /** 修改优惠券规则(满减门槛 / 优惠金额 / 有效期)。 */
    @PatchMapping("/coupons/{couponId}")
    public ApiResponse<Coupon> updateCoupon(
            @PathVariable String couponId,
            @Valid @RequestBody CouponRequest request) {
        return ApiResponse.ok(orderingService.updateCoupon(couponId, request));
    }

    /** 软删除优惠券。已经领取的券是否能用,会在下单时再次校验。 */
    @DeleteMapping("/coupons/{couponId}")
    public ApiResponse<Coupon> disableCoupon(@PathVariable String couponId) {
        return ApiResponse.ok(orderingService.disableCoupon(couponId));
    }

    // ===== 订单管理 =====

    /** 后台查看所有用户的订单。 */
    @GetMapping("/orders")
    public ApiResponse<List<Order>> listOrders() {
        return ApiResponse.ok(orderingService.listOrdersForAdmin(null));
    }

    /** 店员手动把订单改为"已完成"。 */
    @PatchMapping("/orders/{orderId}/complete")
    public ApiResponse<Order> completeOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderingService.completeOrder(orderId));
    }

    /** 店员代客取消订单。Service 层会回滚销量、优惠券、用户积分统计。 */
    @PatchMapping("/orders/{orderId}/cancel")
    public ApiResponse<Order> cancelOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderingService.cancelOrderForAdmin(orderId));
    }

    /** 后台用户管理:查看所有用户资料(昵称 / 会员等级 / 积分 / 券数)。 */
    @GetMapping("/users")
   public ApiResponse<List<UserProfile>> listUsers() {
        return ApiResponse.ok(orderingService.listUsersForAdmin());
    }
}
