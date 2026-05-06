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

@Service
public class OrderingService {
    private final StoreMapper storeMapper;
    private final ProductMapper productMapper;
    private final CartMapper cartMapper;
    private final OrderMapper orderMapper;
    private final UserMapper userMapper;

    public OrderingService(StoreMapper storeMapper, ProductMapper productMapper,
                           CartMapper cartMapper, OrderMapper orderMapper, UserMapper userMapper) {
        this.storeMapper = storeMapper;
        this.productMapper = productMapper;
        this.cartMapper = cartMapper;
        this.orderMapper = orderMapper;
        this.userMapper = userMapper;
    }

    public Store getStore() {
        Store store = storeMapper.findStore();
        if (store == null) {
            throw new BusinessException(404, "门店不存在");
        }
        return store;
    }

    public List<Banner> listBanners() {
        return storeMapper.listEnabledBanners();
    }

    public List<Banner> listAllBannersForAdmin() {
        return storeMapper.listBanners();
    }

    @Transactional
    public Banner createBanner(BannerRequest request) {
        Banner banner = new Banner(newId("BANNER"), request.getTitle(), defaultText(request.getSubtitle()),
                defaultText(request.getTagText()), defaultImage(request.getImage()), defaultText(request.getLinkText()),
                defaultText(request.getLinkUrl()), request.getSort(), request.isEnabled());
        storeMapper.insertBanner(banner);
        return banner;
    }

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

    @Transactional
    public Banner disableBanner(String bannerId) {
        Banner existing = storeMapper.findBannerById(bannerId);
        if (existing == null) {
            throw new BusinessException(404, "Banner 不存在");
        }
        storeMapper.disableBanner(bannerId);
        return storeMapper.findBannerById(bannerId);
    }

    public List<Category> listCategories() {
        return storeMapper.listCategories();
    }

    // 前台商品列表只返回 enabled=1 的商品。
    // categoryId 和 keyword 都是可选条件，由 ProductMapper 拼接到 SQL 中查询。
    public List<Product> listProducts(String categoryId, String keyword) {
        return productMapper.listEnabled(categoryId, keyword);
    }

    // 商品详情页使用。
    // 这里用 findEnabledById，表示下架商品不能在前台详情页继续访问。
    public Product getProduct(String productId) {
        Product product = productMapper.findEnabledById(productId);
        if (product == null) {
            throw new BusinessException(404, "商品不存在");
        }
        return product;
    }

    public List<Coupon> listCoupons() {
        return storeMapper.listCoupons();
    }

    public List<UserCoupon> listUserCoupons(String userId) {
        userMapper.refreshCouponCount(userId);
        return userMapper.listUserCoupons(userId);
    }

    @Transactional
    public UserCoupon claimCoupon(String userId, String couponId) {
        UserProfile profile = getUserProfile(userId);
        // 业务规则：没有开通省钱卡，不能领取优惠券。
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

    public List<Category> listAllCategoriesForAdmin() {
        return storeMapper.listCategories();
    }

    @Transactional
    public Category createCategory(CategoryRequest request) {
        Category category = new Category(newCategoryId(), request.getName(), request.getSort());
        storeMapper.insertCategory(category);
        return category;
    }

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

    @Transactional
    public Category deleteCategory(String categoryId) {
        Category existing = storeMapper.findCategoryById(categoryId);
        if (existing == null) {
            throw new BusinessException(404, "分类不存在");
        }
        if (productMapper.countByCategory(categoryId) > 0) {
            throw new BusinessException(400, "该分类下还有菜品，不能删除");
        }
        storeMapper.deleteCategory(categoryId);
        return existing;
    }

    public List<Coupon> listAllCouponsForAdmin() {
        return storeMapper.listCoupons();
    }

    @Transactional
    public Coupon createCoupon(CouponRequest request) {
        Coupon coupon = new Coupon(newCouponId(), request.getTitle(), request.getConditionText(),
                request.getMinAmount(), request.getDiscountAmount(), request.getValidUntil(), request.isAvailable());
        storeMapper.insertCoupon(coupon);
        return coupon;
    }

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

    @Transactional
    public Coupon disableCoupon(String couponId) {
        Coupon existing = storeMapper.findCouponById(couponId);
        if (existing == null) {
            throw new BusinessException(404, "优惠券不存在");
        }
        storeMapper.disableCoupon(couponId);
        return storeMapper.findCouponById(couponId);
    }

    public List<SavingCardPlan> listSavingCardPlans() {
        return storeMapper.listSavingCardPlans();
    }

    public UserProfile getUserProfile(String userId) {
        UserProfile userProfile = userMapper.findProfileByUserId(userId);
        if (userProfile == null) {
            throw new BusinessException(404, "用户资料不存在");
        }
        return userProfile;
    }

    @Transactional
    public UserProfile openSavingCard(String userId) {
        userMapper.updateMemberLevel(userId, "省钱卡会员");
        return getUserProfile(userId);
    }

    public CartSummary getCartSummary(String userId) {
        List<CartItem> items = cartMapper.listCartItems(userId);
        // totalQuantity 是购物车商品总件数，用于点餐页底部“已选 X 件”。
        int totalQuantity = items.stream().mapToInt(CartItem::getQuantity).sum();
        // totalAmount 是购物车商品总金额，用于购物车页和提交订单页。
        BigDecimal totalAmount = items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartSummary(items, totalQuantity, totalAmount, "结算时可选择可用优惠券。");
    }

    @Transactional
    public CartSummary addCartItem(String userId, AddCartItemRequest request) {
        // 先查商品，确保 productId 对应的是一个仍在售的商品。
        Product product = getProduct(request.getProductId());
        String spec = normalizeSpec(request.getSpec());
        // 同一个用户、同一个商品、同一个规格，只保留一条购物车记录。
        // 如果已经存在，就增加数量；否则插入新记录。
        CartItem existingItem = cartMapper.findByProductAndSpec(userId, product.getId(), spec);

        if (existingItem != null) {
            cartMapper.increaseQuantity(userId, existingItem.getId(), request.getQuantity());
        } else {
            cartMapper.insertForUser(newId("CART"), userId, product.getId(), spec, request.getQuantity());
        }
        return getCartSummary(userId);
    }

    @Transactional
    public CartSummary updateCartItem(String userId, String itemId, int quantity) {
        if (cartMapper.updateQuantity(userId, itemId, quantity) == 0) {
            throw new BusinessException(404, "购物车商品不存在");
        }
        return getCartSummary(userId);
    }

    @Transactional
    public CartSummary deleteCartItem(String userId, String itemId) {
        if (cartMapper.deleteById(userId, itemId) == 0) {
            throw new BusinessException(404, "购物车商品不存在");
        }
        return getCartSummary(userId);
    }

    @Transactional
    public CartSummary clearCart(String userId) {
        cartMapper.clear(userId);
        return getCartSummary(userId);
    }

    public List<Order> listOrders(String userId, String status) {
        // 查询订单主表后，再给每个订单补上订单明细。
        return orderMapper.listOrders(userId, status).stream()
                .map(this::attachOrderItems)
                .collect(Collectors.toList());
    }

    public List<Order> listOrdersForAdmin(String status) {
        return orderMapper.listOrdersForAdmin(status).stream()
                .map(this::attachOrderItems)
                .collect(Collectors.toList());
    }

    public Order getOrder(String userId, String orderId) {
        Order order = orderMapper.findOrder(orderId, userId);
        if (order == null) {
            throw new BusinessException(404, "订单不存在");
        }
        return attachOrderItems(order);
    }

    @Transactional
    public Order createOrder(String userId, CreateOrderRequest request) {
        // 提交订单时，商品清单从购物车读取，不从前端请求体读取。
        // 这样可以避免前端自己传价格导致金额被篡改。
        List<CartItem> cartItems = cartMapper.listCartItems(userId);
        if (cartItems.isEmpty()) {
            throw new BusinessException(400, "购物车为空");
        }

        // 把购物车项转换成订单明细项。
        List<OrderItem> orderItems = cartItems.stream()
                .map(item -> new OrderItem(item.getProductId(), item.getProductName(), item.getSpec(),
                        item.getPrice(), item.getQuantity()))
                .collect(Collectors.toList());

        // 计算商品总价。
        BigDecimal totalAmount = orderItems.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // 根据用户选择的优惠券计算优惠金额。
        BigDecimal discountAmount = calculateDiscount(userId, request.getCouponId(), totalAmount);
        // 实付金额 = 商品总价 - 优惠金额，最低不能小于 0。
        BigDecimal payableAmount = totalAmount.subtract(discountAmount).max(BigDecimal.ZERO);

        Order order = new Order(
                newId("ORDER"),
                userId,
                buildOrderNo(),
                request.getPickupType(),
                getStore().getName(),
                request.getTableNo(),
                request.getRemark(),
                "WAITING_PICKUP",
                totalAmount,
                discountAmount,
                payableAmount,
                LocalDateTime.now(),
                orderItems
        );
        // 写入订单主表。
        orderMapper.insertOrder(order);
        for (OrderItem item : orderItems) {
            // 写入订单明细表，并增加商品销量。
            orderMapper.insertOrderItem(order.getId(), item);
            productMapper.increaseSales(item.getProductId(), item.getQuantity());
        }
        if (StringUtils.hasText(request.getCouponId())) {
            // 如果用了优惠券，要把用户优惠券标记为已使用。
            int updated = userMapper.markUserCouponUsed(userId, request.getCouponId(), order.getId(), LocalDateTime.now());
            if (updated == 0) {
                throw new BusinessException(400, "优惠券已使用，请重新选择");
            }
        }
        // 更新用户积分、节省金额等统计数据。
        userMapper.addOrderStats(userId, payableAmount.intValue(), discountAmount);
        // 订单已经生成，购物车需要清空。
        cartMapper.clear(userId);
        return order;
    }

    @Transactional
    public Order cancelOrder(String userId, String orderId) {
        Order order = getOrder(userId, orderId);
        // 已完成订单不能取消，这是最基本的订单状态规则。
        if ("COMPLETED".equals(order.getStatus())) {
            throw new BusinessException(400, "已完成订单不能取消");
        }
        if ("CANCELED".equals(order.getStatus())) {
            return order;
        }
        // 取消订单时，要回滚销量、优惠券和用户统计。
        rollbackOrderEffects(order);
        orderMapper.updateStatus(orderId, "CANCELED");
        return getOrder(userId, orderId);
    }

    @Transactional
    public Order completeOrder(String orderId) {
        Order order = getOrderForAdmin(orderId);
        if ("CANCELED".equals(order.getStatus())) {
            throw new BusinessException(400, "已取消订单不能完成");
        }
        orderMapper.updateStatus(orderId, "COMPLETED");
        return getOrderForAdmin(orderId);
    }

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

    @Transactional
    public CartSummary repeatOrder(String userId, String orderId) {
        Order order = getOrder(userId, orderId);
        // 再来一单不是直接创建订单，而是把历史订单商品重新加入购物车。
        // 这样用户还可以在购物车里调整数量或规格后再提交。
        for (OrderItem item : order.getItems()) {
            AddCartItemRequest request = new AddCartItemRequest();
            request.setProductId(item.getProductId());
            request.setSpec(item.getSpec());
            request.setQuantity(item.getQuantity());
            addCartItem(userId, request);
        }
        return getCartSummary(userId);
    }

    public List<UserProfile> listUsersForAdmin() {
        return userMapper.listProfiles();
    }

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

    public List<Product> listAllProductsForAdmin() {
        return productMapper.listAll();
    }

    @Transactional
    public Product createProduct(ProductRequest request) {
        // 后台新增商品前，先确认分类存在。
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

    @Transactional
    public Product disableProduct(String productId) {
        Product existing = productMapper.findById(productId);
        if (existing == null) {
            throw new BusinessException(404, "商品不存在");
        }
        productMapper.disable(productId);
        return productMapper.findById(productId);
    }

    private Order attachOrderItems(Order order) {
        // 订单主表和订单明细表是分开的。
        // 查询订单列表时，需要额外查一次明细并放入 order.items。
        order.setItems(orderMapper.listOrderItems(order.getId()));
        return order;
    }

    private void rollbackOrderEffects(Order order) {
        // 取消订单时，需要把提交订单造成的影响恢复回去。
        for (OrderItem item : order.getItems()) {
            productMapper.decreaseSales(item.getProductId(), item.getQuantity());
        }
        userMapper.restoreCouponByOrder(order.getUserId(), order.getId());
        userMapper.subtractOrderStats(order.getUserId(), order.getPayableAmount().intValue(), order.getDiscountAmount());
    }

    private boolean isSavingCardMember(UserProfile profile) {
        return profile != null && StringUtils.hasText(profile.getMemberLevel())
                && profile.getMemberLevel().contains("省钱卡");
    }

    private Order getOrderForAdmin(String orderId) {
        Order order = orderMapper.findOrder(orderId, null);
        if (order == null) {
            throw new BusinessException(404, "订单不存在");
        }
        return attachOrderItems(order);
    }

    private void ensureCategoryExists(String categoryId) {
        if (storeMapper.countCategory(categoryId) == 0) {
            throw new BusinessException(404, "分类不存在");
        }
    }

    private BigDecimal calculateDiscount(String userId, String couponId, BigDecimal totalAmount) {
        if (!StringUtils.hasText(couponId)) {
            return BigDecimal.ZERO;
        }
        // 只允许使用“当前用户已经领取，并且状态可用”的优惠券。
        UserCoupon coupon = userMapper.findAvailableUserCoupon(userId, couponId);
        if (coupon == null || !coupon.isCouponAvailable()) {
            throw new BusinessException(400, "请先领取该优惠券或优惠券已使用");
        }
        BigDecimal minAmount = coupon.getMinAmount() == null ? BigDecimal.ZERO : coupon.getMinAmount();
        // 判断满减门槛，例如满 20 元可用。如果订单金额不足，就不能抵扣。
        if (totalAmount.compareTo(minAmount) < 0) {
            throw new BusinessException(400, "订单金额未达到优惠券使用门槛");
        }
        // 优惠金额不能超过订单总金额，防止出现负数订单。
        return coupon.getDiscountAmount().min(totalAmount);
    }

    private String normalizeSpec(String spec) {
        return StringUtils.hasText(spec) ? spec.trim() : "标准杯";
    }

    private String buildOrderNo() {
        return "UMO" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    private String newId(String prefix) {
        return prefix + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private String newProductId() {
        return "P-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"))
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    private String newCategoryId() {
        return "CAT-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"))
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    private String newCouponId() {
        return "C-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"))
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    private String defaultText(String value) {
        return StringUtils.hasText(value) ? value.trim() : "";
    }

    private String defaultImage(String value) {
        return StringUtils.hasText(value) ? value.trim() : "/images/product-default.svg";
    }
}
