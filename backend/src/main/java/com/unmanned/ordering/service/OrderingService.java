package com.unmanned.ordering.service;

import com.unmanned.ordering.exception.BusinessException;
import com.unmanned.ordering.mapper.CartMapper;
import com.unmanned.ordering.mapper.OrderMapper;
import com.unmanned.ordering.mapper.ProductMapper;
import com.unmanned.ordering.mapper.StoreMapper;
import com.unmanned.ordering.mapper.UserMapper;
import com.unmanned.ordering.model.AdminDashboard;
import com.unmanned.ordering.model.Banner;
import com.unmanned.ordering.model.CartItem;
import com.unmanned.ordering.model.CartSummary;
import com.unmanned.ordering.model.Category;
import com.unmanned.ordering.model.Coupon;
import com.unmanned.ordering.model.Order;
import com.unmanned.ordering.model.OrderItem;
import com.unmanned.ordering.model.Product;
import com.unmanned.ordering.model.SavingCardPlan;
import com.unmanned.ordering.model.Store;
import com.unmanned.ordering.model.UserCoupon;
import com.unmanned.ordering.model.UserProfile;
import com.unmanned.ordering.request.AddCartItemRequest;
import com.unmanned.ordering.request.BannerRequest;
import com.unmanned.ordering.request.CategoryRequest;
import com.unmanned.ordering.request.CouponRequest;
import com.unmanned.ordering.request.CreateOrderRequest;
import com.unmanned.ordering.request.ProductRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 核心业务服务类。
 *
 * 负责把"前端发过来的请求"转换为"对数据库的若干次读写",
 * 涵盖:门店信息 / Banner / 商品分类 / 商品 / 优惠券 / 省钱卡 /
 *      购物车 / 订单 / 用户资料 / 后台管理 共 10 类业务。
 *
 * 设计原则:
 *   1. Controller 只接收请求并返回响应,业务规则全部下沉到这里。
 *   2. 涉及多表写入的方法必须加 @Transactional,保证一起成功或一起回滚。
 *   3. 业务异常一律抛 BusinessException,由全局异常处理器统一转成 HTTP 响应。
 *   4. 价格、订单号等"敏感字段"由后端生成,不接受前端传入,防止被篡改。
 *
 * 一笔下单的完整业务流程:
 *   listProducts → addCartItem → 用户在购物车页选择优惠券 →
 *   createOrder(后端从购物车读商品,计算优惠并写入订单表) →
 *   店员在后台 completeOrder;若用户中途反悔 → cancelOrder(回滚销量、优惠券、积分)。
 */
@Service
public class OrderingService {
    // 五个 Mapper:分别访问门店、商品、购物车、订单、用户 5 张相关表
    private final StoreMapper storeMapper;      // 门店 / Banner / 分类 / 优惠券 / 省钱卡
    private final ProductMapper productMapper;  // 商品
    private final CartMapper cartMapper;        // 购物车
    private final OrderMapper orderMapper;      // 订单 + 订单明细
    private final UserMapper userMapper;        // 用户资料 + 用户优惠券

    /** 构造函数注入:Spring 启动时自动把 5 个 Mapper 实例传进来。 */
    public OrderingService(StoreMapper storeMapper, ProductMapper productMapper,
                           CartMapper cartMapper, OrderMapper orderMapper, UserMapper userMapper) {
        this.storeMapper = storeMapper;
        this.productMapper = productMapper;
        this.cartMapper = cartMapper;
        this.orderMapper = orderMapper;
        this.userMapper = userMapper;
    }

    // ============================================================
    // 一、门店与 Banner
    // ============================================================

    /**
     * 获取门店信息。
     * 当前业务只配置了一个门店(云豹双流北京华联店),所以是单条记录。
     *
     * @throws BusinessException 404 当数据库里没有门店记录时
     */
    public Store getStore() {
        Store store = storeMapper.findStore();
        if (store == null) {
            throw new BusinessException(404, "门店不存在");
        }
        return store;
    }

    /** 前台首页轮播:只返回 enabled=1 的 Banner,按 sort 排序。 */
    public List<Banner> listBanners() {
        return storeMapper.listEnabledBanners();
    }

    /** 后台管理用:返回所有 Banner(含已下架的),便于管理员编辑。 */
    public List<Banner> listAllBannersForAdmin() {
        return storeMapper.listBanners();
    }

    /** 后台新增 Banner。Banner ID 由后端生成("BANNER-时间戳-UUID")。 */
    @Transactional
    public Banner createBanner(BannerRequest request) {
        Banner banner = new Banner(newId("BANNER"), request.getTitle(), defaultText(request.getSubtitle()),
                defaultText(request.getTagText()), defaultImage(request.getImage()), defaultText(request.getLinkText()),
                defaultText(request.getLinkUrl()), request.getSort(), request.isEnabled());
        storeMapper.insertBanner(banner);
        return banner;
    }

    /** 后台修改 Banner。先校验存在性,再整体 update。 */
    @Transactional
    public Banner updateBanner(String bannerId, BannerRequest request) {
        Banner existing = storeMapper.findBannerById(bannerId);
        if (existing == null) {
            throw new BusinessException(404, "Banner 不存在");
        }
        Banner banner = new Banner(bannerId, request.getTitle(), defaultText(request.getSubtitle()),
                defaultText(request.getTagText()), defaultImage(request.getImage()), defaultText(request.getLinkText()),
                defaultText(request.getLinkUrl()), request.getSort(), request.isEnabled());
        storeMapper.updateBanner(banner);
        return storeMapper.findBannerById(bannerId);
    }

    /** 后台下架 Banner(软删除,数据保留,只把 enabled 置 false)。 */
    @Transactional
    public Banner disableBanner(String bannerId) {
        Banner existing = storeMapper.findBannerById(bannerId);
        if (existing == null) {
            throw new BusinessException(404, "Banner 不存在");
        }
        storeMapper.disableBanner(bannerId);
        return storeMapper.findBannerById(bannerId);
    }

    // ============================================================
    // 二、商品分类与商品
    // ============================================================

    /** 前台与后台共用:返回所有商品分类。 */
    public List<Category> listCategories() {
        return storeMapper.listCategories();
    }

    /**
     * 前台商品列表。
     * 只返回 enabled=1 的商品。
     * categoryId 和 keyword 都是可选条件:
     *   - 没传 → 查所有上架商品
     *   - 传 categoryId → 按分类筛选
     *   - 传 keyword → 按商品名模糊匹配
     */
    public List<Product> listProducts(String categoryId, String keyword) {
        return productMapper.listEnabled(categoryId, keyword);
    }

    /**
     * 商品详情页使用。
     * 用 findEnabledById,意味着下架商品不能在前台详情页继续访问。
     *
     * @throws BusinessException 404 商品不存在或已下架
     */
    public Product getProduct(String productId) {
        Product product = productMapper.findEnabledById(productId);
        if (product == null) {
            throw new BusinessException(404, "商品不存在");
        }
        return product;
    }

    // ============================================================
    // 三、优惠券与省钱卡
    // ============================================================

    /** 前台:列出所有可领取的优惠券(用于"省钱卡"页和首页券中心)。 */
    public List<Coupon> listCoupons() {
        return storeMapper.listCoupons();
    }

    /**
     * 列出当前用户已领取的所有优惠券。
     * 先刷新一下用户表的"优惠券数量"字段(用于"我的"页展示),再返回明细。
     */
    public List<UserCoupon> listUserCoupons(String userId) {
        userMapper.refreshCouponCount(userId);
        return userMapper.listUserCoupons(userId);
    }

    /**
     * 用户领取优惠券。
     *
     * 业务规则:
     *   1. 没开通省钱卡的用户不能领券(强制引流到省钱卡)。
     *   2. 优惠券必须存在且 available=1。
     *   3. 同一张券只能领一次:已领过就返回原记录,不重复写。
     */
    @Transactional
    public UserCoupon claimCoupon(String userId, String couponId) {
        UserProfile profile = getUserProfile(userId);
        if (!isSavingCardMember(profile)) {
            throw new BusinessException(400, "请先开通省钱卡后领取优惠券");
        }
        Coupon coupon = storeMapper.findCouponById(couponId);
        if (coupon == null || !coupon.isAvailable()) {
            throw new BusinessException(404, "优惠券不存在或已下架");
        }
        if (userMapper.countUserCoupon(userId, couponId) == 0) {
            userMapper.insertUserCoupon(newId("UC"), userId, couponId, "AVAILABLE", LocalDateTime.now());
        }
        userMapper.refreshCouponCount(userId);
        return userMapper.findUserCoupon(userId, couponId);
    }

    // ============================================================
    // 四、分类后台管理
    // ============================================================

    /** 后台分类列表(与前台共用一个 SQL,因为分类无"下架"概念)。 */
    public List<Category> listAllCategoriesForAdmin() {
        return storeMapper.listCategories();
    }

    /** 后台新增分类。 */
    @Transactional
    public Category createCategory(CategoryRequest request) {
        Category category = new Category(newCategoryId(), request.getName(), request.getSort());
        storeMapper.insertCategory(category);
        return category;
    }

    /** 后台修改分类。 */
    @Transactional
    public Category updateCategory(String categoryId, CategoryRequest request) {
        Category existing = storeMapper.findCategoryById(categoryId);
        if (existing == null) {
            throw new BusinessException(404, "分类不存在");
        }
        Category category = new Category(categoryId, request.getName(), request.getSort());
        storeMapper.updateCategory(category);
        return storeMapper.findCategoryById(categoryId);
    }

    /**
     * 后台删除分类。
     * 安全约束:分类下还有商品时,禁止删除。否则商品会变成"无家可归"。
     */
    @Transactional
    public Category deleteCategory(String categoryId) {
        Category existing = storeMapper.findCategoryById(categoryId);
        if (existing == null) {
            throw new BusinessException(404, "分类不存在");
        }
        if (productMapper.countByCategory(categoryId) > 0) {
            throw new BusinessException(400, "该分类下还有菜品,不能删除");
        }
        storeMapper.deleteCategory(categoryId);
        return existing;
    }

    // ============================================================
    // 五、优惠券后台管理
    // ============================================================

    /** 后台优惠券列表(含下架)。 */
    public List<Coupon> listAllCouponsForAdmin() {
        return storeMapper.listCoupons();
    }

    /** 后台新增优惠券。 */
    @Transactional
    public Coupon createCoupon(CouponRequest request) {
        Coupon coupon = new Coupon(newCouponId(), request.getTitle(), request.getConditionText(),
                request.getMinAmount(), request.getDiscountAmount(), request.getValidUntil(), request.isAvailable());
        storeMapper.insertCoupon(coupon);
        return coupon;
    }

    /** 后台修改优惠券。 */
    @Transactional
    public Coupon updateCoupon(String couponId, CouponRequest request) {
        Coupon existing = storeMapper.findCouponById(couponId);
        if (existing == null) {
            throw new BusinessException(404, "优惠券不存在");
        }
        Coupon coupon = new Coupon(couponId, request.getTitle(), request.getConditionText(),
                request.getMinAmount(), request.getDiscountAmount(), request.getValidUntil(), request.isAvailable());
        storeMapper.updateCoupon(coupon);
        return storeMapper.findCouponById(couponId);
    }

    /** 后台下架优惠券(软删除)。 */
    @Transactional
    public Coupon disableCoupon(String couponId) {
        Coupon existing = storeMapper.findCouponById(couponId);
        if (existing == null) {
            throw new BusinessException(404, "优惠券不存在");
        }
        storeMapper.disableCoupon(couponId);
        return storeMapper.findCouponById(couponId);
    }

    // ============================================================
    // 六、省钱卡与用户资料
    // ============================================================

    /** 省钱卡方案列表(月卡 / 季卡 / 年卡)。 */
    public List<SavingCardPlan> listSavingCardPlans() {
        return storeMapper.listSavingCardPlans();
    }

    /**
     * 获取用户资料。
     * 前台"我的"页 + 领券前的会员资格校验都会调用这个方法。
     *
     * @throws BusinessException 404 用户资料不存在(理论上每个登录用户都应该有)
     */
    public UserProfile getUserProfile(String userId) {
        UserProfile userProfile = userMapper.findProfileByUserId(userId);
        if (userProfile == null) {
            throw new BusinessException(404, "用户资料不存在");
        }
        return userProfile;
    }

    /**
     * 开通省钱卡。
     * 简化实现:不接支付,直接把 member_level 字段置为"省钱卡会员"。
     * 真实业务里这里需要先验证支付回调成功才能开通。
     */
    @Transactional
    public UserProfile openSavingCard(String userId) {
        userMapper.updateMemberLevel(userId, "省钱卡会员");
        return getUserProfile(userId);
    }

    // ============================================================
    // 七、购物车
    // ============================================================

    /**
     * 获取用户购物车摘要。
     * 返回的对象包含:
     *   - items:购物车里所有商品明细
     *   - totalQuantity:总件数(用于点餐页底部"已选 X 件")
     *   - totalAmount:总金额(用于购物车页和支付条)
     */
    public CartSummary getCartSummary(String userId) {
        List<CartItem> items = cartMapper.listCartItems(userId);
        int totalQuantity = items.stream().mapToInt(CartItem::getQuantity).sum();
        BigDecimal totalAmount = items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartSummary(items, totalQuantity, totalAmount, "结算时可选择可用优惠券。");
    }

    /**
     * 加入购物车。
     *
     * 业务规则:
     *   1. 商品必须存在且上架(getProduct 会校验)。
     *   2. 同一用户 + 同一商品 + 同一规格 → 合并为一条记录,数量累加。
     *   3. 不允许前端传价格 —— 价格由 Product 表读出来。
     */
    @Transactional
    public CartSummary addCartItem(String userId, AddCartItemRequest request) {
        Product product = getProduct(request.getProductId());
        String spec = normalizeSpec(request.getSpec());
        CartItem existingItem = cartMapper.findByProductAndSpec(userId, product.getId(), spec);

        if (existingItem != null) {
            cartMapper.increaseQuantity(userId, existingItem.getId(), request.getQuantity());
        } else {
            cartMapper.insertForUser(newId("CART"), userId, product.getId(), spec, request.getQuantity());
        }
        return getCartSummary(userId);
    }

    /** 修改购物车某项数量。如果该项不属于当前用户或不存在,抛 404。 */
    @Transactional
    public CartSummary updateCartItem(String userId, String itemId, int quantity) {
        if (cartMapper.updateQuantity(userId, itemId, quantity) == 0) {
            throw new BusinessException(404, "购物车商品不存在");
        }
        return getCartSummary(userId);
    }

    /** 删除购物车某项。 */
    @Transactional
    public CartSummary deleteCartItem(String userId, String itemId) {
        if (cartMapper.deleteById(userId, itemId) == 0) {
            throw new BusinessException(404, "购物车商品不存在");
        }
        return getCartSummary(userId);
    }

    /** 清空当前用户的购物车。提交订单后会自动调一次。 */
    @Transactional
    public CartSummary clearCart(String userId) {
        cartMapper.clear(userId);
        return getCartSummary(userId);
    }

    // ============================================================
    // 八、订单
    // ============================================================

    /**
     * 前台订单列表。
     * status 可传 "WAITING_PICKUP" / "COMPLETED" / "CANCELED" 过滤;
     * 不传则返回全部。订单明细在 attachOrderItems 里单独查并附加上去。
     */
    public List<Order> listOrders(String userId, String status) {
        return orderMapper.listOrders(userId, status).stream()
                .map(this::attachOrderItems)
                .collect(Collectors.toList());
    }

    /** 后台订单列表(不限定用户,所有人的订单都能看)。 */
    public List<Order> listOrdersForAdmin(String status) {
        return orderMapper.listOrdersForAdmin(status).stream()
                .map(this::attachOrderItems)
                .collect(Collectors.toList());
    }

    /**
     * 获取单个订单(前台用,必须是 userId 自己的订单)。
     *
     * @throws BusinessException 404 订单不属于该用户或不存在
     */
    public Order getOrder(String userId, String orderId) {
        Order order = orderMapper.findOrder(orderId, userId);
        if (order == null) {
            throw new BusinessException(404, "订单不存在");
        }
        return attachOrderItems(order);
    }

    /**
     * 提交订单 —— 整个系统最复杂的方法之一。
     *
     * 七步走:
     *   1. 从购物车读商品(不接受前端传商品,防价格篡改)。
     *   2. 把购物车项转成订单明细(冻结当时的价格)。
     *   3. 计算商品总价。
     *   4. 根据用户选的优惠券计算优惠金额(满门槛才有效)。
     *   5. 实付金额 = 总价 - 优惠,且不能小于 0。
     *   6. 写订单主表 + 订单明细表 + 增加商品销量 + 标记优惠券已用。
     *   7. 更新用户统计(积分、累计节省)+ 清空购物车。
     *
     * 整个方法在事务里,任一步失败全部回滚,不会出现"扣了券但订单没生成"。
     */
    @Transactional
    public Order createOrder(String userId, CreateOrderRequest request) {
        // 第 1 步:从购物车读商品。前端传过来的请求只包含 pickupType、couponId、tableNo、remark 等元数据,
        // 商品列表绝不接受前端传入 —— 防止前端篡改价格。
        List<CartItem> cartItems = cartMapper.listCartItems(userId);
        if (cartItems.isEmpty()) {
            throw new BusinessException(400, "购物车为空");
        }

        // 第 2 步:转成订单明细。注意 price 来自购物车,而购物车的 price 又来自 Product 表。
        List<OrderItem> orderItems = cartItems.stream()
                .map(item -> new OrderItem(item.getProductId(), item.getProductName(), item.getSpec(),
                        item.getPrice(), item.getQuantity()))
                .collect(Collectors.toList());

        // 第 3 步:商品总价。
        BigDecimal totalAmount = orderItems.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 第 4 步:优惠金额(如果选了券)。calculateDiscount 内部会校验"是否已领"和"是否满门槛"。
        BigDecimal discountAmount = calculateDiscount(userId, request.getCouponId(), totalAmount);

        // 第 5 步:实付金额。max(0) 保证哪怕券面额比总价大,实付也不会变成负数。
        BigDecimal payableAmount = totalAmount.subtract(discountAmount).max(BigDecimal.ZERO);

        // 组装订单对象。订单号格式: UMO + 年月日时分秒 + 4 位 UUID。
        Order order = new Order(
                newId("ORDER"),
                userId,
                buildOrderNo(),
                request.getPickupType(),
                getStore().getName(),
                request.getTableNo(),
                request.getRemark(),
                "WAITING_PICKUP",   // 初始状态:等待取餐
                totalAmount,
                discountAmount,
                payableAmount,
                LocalDateTime.now(),
                orderItems
        );

        // 第 6 步:落库 —— 订单主表 + 订单明细 + 商品销量 + 优惠券标记。
        orderMapper.insertOrder(order);
        for (OrderItem item : orderItems) {
            orderMapper.insertOrderItem(order.getId(), item);
            productMapper.increaseSales(item.getProductId(), item.getQuantity());
        }
        if (StringUtils.hasText(request.getCouponId())) {
            // 把用户优惠券状态置为已用,同时绑定到这个订单(取消订单时可以反查并恢复)。
            int updated = userMapper.markUserCouponUsed(userId, request.getCouponId(), order.getId(), LocalDateTime.now());
            if (updated == 0) {
                throw new BusinessException(400, "优惠券已使用,请重新选择");
            }
        }

        // 第 7 步:用户统计 + 清空购物车。
        userMapper.addOrderStats(userId, payableAmount.intValue(), discountAmount);
        cartMapper.clear(userId);
        return order;
    }

    /**
     * 取消订单(前台,用户自己取消)。
     * 已完成的订单不能取消(必须找店员退款);已取消的订单调用幂等(直接返回)。
     * 取消时必须回滚所有"提交时的副作用":销量、优惠券、用户积分。
     */
    @Transactional
    public Order cancelOrder(String userId, String orderId) {
        Order order = getOrder(userId, orderId);
        if ("COMPLETED".equals(order.getStatus())) {
            throw new BusinessException(400, "已完成订单不能取消");
        }
        if ("CANCELED".equals(order.getStatus())) {
            return order;  // 幂等:重复取消直接返回
        }
        rollbackOrderEffects(order);
        orderMapper.updateStatus(orderId, "CANCELED");
        return getOrder(userId, orderId);
    }

    /**
     * 完成订单(后台,店员手动点击"完成取餐")。
     * 已取消的订单不能再被标记完成(状态机限制)。
     */
    @Transactional
    public Order completeOrder(String orderId) {
        Order order = getOrderForAdmin(orderId);
        if ("CANCELED".equals(order.getStatus())) {
            throw new BusinessException(400, "已取消订单不能完成");
        }
        orderMapper.updateStatus(orderId, "COMPLETED");
        return getOrderForAdmin(orderId);
    }

    /** 后台取消订单(店员代客取消,逻辑与前台 cancelOrder 一致,只是不绑定 userId)。 */
    @Transactional
    public Order cancelOrderForAdmin(String orderId) {
        Order order = getOrderForAdmin(orderId);
        if ("COMPLETED".equals(order.getStatus())) {
            throw new BusinessException(400, "已完成订单不能取消");
        }
        if ("CANCELED".equals(order.getStatus())) {
            return order;
        }
        rollbackOrderEffects(order);
        orderMapper.updateStatus(orderId, "CANCELED");
        return getOrderForAdmin(orderId);
    }

    /**
     * 再来一单。
     * 注意:不是直接创建订单,而是把历史订单里的商品重新加入购物车,
     * 这样用户能在购物车里调整数量或规格后再确认提交。
     */
    @Transactional
    public CartSummary repeatOrder(String userId, String orderId) {
        Order order = getOrder(userId, orderId);
        for (OrderItem item : order.getItems()) {
            AddCartItemRequest request = new AddCartItemRequest();
            request.setProductId(item.getProductId());
            request.setSpec(item.getSpec());
            request.setQuantity(item.getQuantity());
            addCartItem(userId, request);
        }
        return getCartSummary(userId);
    }

    // ============================================================
    // 九、后台管理(用户 / 仪表盘 / 商品)
    // ============================================================

    /** 后台用户列表。 */
    public List<UserProfile> listUsersForAdmin() {
        return userMapper.listProfiles();
    }

    /** 后台首页数据看板:商品数、订单数、购物车数、订单总收入。 */
    public AdminDashboard getDashboard() {
        BigDecimal orderAmount = orderMapper.sumPayableAmount();
        if (orderAmount == null) {
            orderAmount = BigDecimal.ZERO;
        }
        return new AdminDashboard(
                productMapper.countEnabled(),
                orderMapper.countOrders(),
                cartMapper.countItems(),
                orderAmount
        );
    }

    /** 后台商品列表(含已下架的)。 */
    public List<Product> listAllProductsForAdmin() {
        return productMapper.listAll();
    }

    /** 后台新增商品。先确认分类存在,然后生成商品 ID 并插库。 */
    @Transactional
    public Product createProduct(ProductRequest request) {
        ensureCategoryExists(request.getCategoryId());
        Product product = new Product(
                newProductId(),
                request.getCategoryId(),
                request.getName(),
                defaultText(request.getDescription()),
                defaultImage(request.getImage()),
                request.getPrice(),
                request.getSales(),
                request.getTags(),
                request.isEnabled()
        );
        productMapper.insert(product);
        return product;
    }

    /** 后台修改商品。整体覆盖,不做部分字段更新。 */
    @Transactional
    public Product updateProduct(String productId, ProductRequest request) {
        Product existing = productMapper.findById(productId);
        if (existing == null) {
            throw new BusinessException(404, "商品不存在");
        }
        ensureCategoryExists(request.getCategoryId());
        Product product = new Product(
                productId,
                request.getCategoryId(),
                request.getName(),
                defaultText(request.getDescription()),
                defaultImage(request.getImage()),
                request.getPrice(),
                request.getSales(),
                request.getTags(),
                request.isEnabled()
        );
        productMapper.update(product);
        return productMapper.findById(productId);
    }

    /** 后台下架商品(软删除)。 */
    @Transactional
    public Product disableProduct(String productId) {
        Product existing = productMapper.findById(productId);
        if (existing == null) {
            throw new BusinessException(404, "商品不存在");
        }
        productMapper.disable(productId);
        return productMapper.findById(productId);
    }

    // ============================================================
    // 十、私有 helper(只在本类内部用)
    // ============================================================

    /**
     * 给一个 Order 对象补上明细列表。
     * 数据库里订单主表和订单明细是两张表,查列表时需要再查一次明细并塞回去。
     */
    private Order attachOrderItems(Order order) {
        order.setItems(orderMapper.listOrderItems(order.getId()));
        return order;
    }

    /**
     * 回滚订单的副作用 —— 取消订单时必须调用。
     * 三件事:
     *   1. 减回商品销量(下单时 +1,取消就 -1)
     *   2. 把使用的优惠券恢复成可用(取消订单不应没收券)
     *   3. 减去用户的累计积分和累计节省
     */
    private void rollbackOrderEffects(Order order) {
        for (OrderItem item : order.getItems()) {
            productMapper.decreaseSales(item.getProductId(), item.getQuantity());
        }
        userMapper.restoreCouponByOrder(order.getUserId(), order.getId());
        userMapper.subtractOrderStats(order.getUserId(), order.getPayableAmount().intValue(), order.getDiscountAmount());
    }

    /** 是否是省钱卡会员 —— 用 member_level 字段是否包含"省钱卡"来判定。 */
    private boolean isSavingCardMember(UserProfile profile) {
        return profile != null && StringUtils.hasText(profile.getMemberLevel())
                && profile.getMemberLevel().contains("省钱卡");
    }

    /** 后台获取订单(不绑定用户,所有人都能看)。 */
    private Order getOrderForAdmin(String orderId) {
        Order order = orderMapper.findOrder(orderId, null);
        if (order == null) {
            throw new BusinessException(404, "订单不存在");
        }
        return attachOrderItems(order);
    }

    /** 确保 categoryId 在 categories 表里存在,否则抛 404。 */
    private void ensureCategoryExists(String categoryId) {
        if (storeMapper.countCategory(categoryId) == 0) {
            throw new BusinessException(404, "分类不存在");
        }
    }

    /**
     * 计算优惠金额。
     *
     * 校验链:
     *   1. couponId 为空 → 0 元优惠(不算错)。
     *   2. 用户没领过这张券,或券已使用 → 400 错误。
     *   3. 订单金额不满门槛(例如满 20 减 5,但订单只 15) → 400 错误。
     *   4. 优惠金额不能超过订单总金额 —— 避免负数订单。
     */
    private BigDecimal calculateDiscount(String userId, String couponId, BigDecimal totalAmount) {
        if (!StringUtils.hasText(couponId)) {
            return BigDecimal.ZERO;
        }
        UserCoupon coupon = userMapper.findAvailableUserCoupon(userId, couponId);
        if (coupon == null || !coupon.isCouponAvailable()) {
            throw new BusinessException(400, "请先领取该优惠券或优惠券已使用");
        }
        BigDecimal minAmount = coupon.getMinAmount() == null ? BigDecimal.ZERO : coupon.getMinAmount();
        if (totalAmount.compareTo(minAmount) < 0) {
            throw new BusinessException(400, "订单金额未达到优惠券使用门槛");
        }
        return coupon.getDiscountAmount().min(totalAmount);
    }

    /** 规格字段统一处理:去空格,空值用"标准杯"兜底。 */
    private String normalizeSpec(String spec) {
        return StringUtils.hasText(spec) ? spec.trim() : "标准杯";
    }

    /** 订单号格式:UMO + yyyyMMddHHmmss + 4 位 UUID 大写。 */
    private String buildOrderNo() {
        return "UMO" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    /** 通用 ID 生成器:前缀 + yyyyMMddHHmmss + 8 位 UUID,可读性比纯 UUID 好。 */
    private String newId(String prefix) {
        return prefix + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    /** 商品 ID:P-时分秒-4 位 UUID,更短(因为商品表 ID 出现频率高)。 */
    private String newProductId() {
        return "P-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"))
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    /** 分类 ID:CAT-时分秒-4 位 UUID。 */
    private String newCategoryId() {
        return "CAT-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"))
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    /** 优惠券 ID:C-时分秒-4 位 UUID。 */
    private String newCouponId() {
        return "C-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"))
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    /** 字符串字段:有内容就 trim,没内容就返回空串(避免 null 入库)。 */
    private String defaultText(String value) {
        return StringUtils.hasText(value) ? value.trim() : "";
    }

    /** 图片字段:有内容就 trim,没内容就返回默认商品图。 */
    private String defaultImage(String value) {
        return StringUtils.hasText(value) ? value.trim() : "/images/product-default.svg";
    }
}
