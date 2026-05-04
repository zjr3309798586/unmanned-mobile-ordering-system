package com.unmanned.ordering.service;

import com.unmanned.ordering.exception.BusinessException;
import com.unmanned.ordering.mapper.CartMapper;
import com.unmanned.ordering.mapper.OrderMapper;
import com.unmanned.ordering.mapper.ProductMapper;
import com.unmanned.ordering.mapper.StoreMapper;
import com.unmanned.ordering.mapper.UserMapper;
import com.unmanned.ordering.model.AdminDashboard;
import com.unmanned.ordering.model.CartItem;
import com.unmanned.ordering.model.CartSummary;
import com.unmanned.ordering.model.Category;
import com.unmanned.ordering.model.Coupon;
import com.unmanned.ordering.model.Order;
import com.unmanned.ordering.model.OrderItem;
import com.unmanned.ordering.model.Product;
import com.unmanned.ordering.model.SavingCardPlan;
import com.unmanned.ordering.model.Store;
import com.unmanned.ordering.model.UserProfile;
import com.unmanned.ordering.request.AddCartItemRequest;
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

    public List<Category> listCategories() {
        return storeMapper.listCategories();
    }

    public List<Product> listProducts(String categoryId, String keyword) {
        return productMapper.listEnabled(categoryId, keyword);
    }

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
                request.getDiscountAmount(), request.getValidUntil(), request.isAvailable());
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
                request.getDiscountAmount(), request.getValidUntil(), request.isAvailable());
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

    public CartSummary getCartSummary(String userId) {
        List<CartItem> items = cartMapper.listCartItems(userId);
        int totalQuantity = items.stream().mapToInt(CartItem::getQuantity).sum();
        BigDecimal totalAmount = items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartSummary(items, totalQuantity, totalAmount, "结算时可选择可用优惠券。");
    }

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
        List<CartItem> cartItems = cartMapper.listCartItems(userId);
        if (cartItems.isEmpty()) {
            throw new BusinessException(400, "购物车为空");
        }

        List<OrderItem> orderItems = cartItems.stream()
                .map(item -> new OrderItem(item.getProductId(), item.getProductName(), item.getSpec(),
                        item.getPrice(), item.getQuantity()))
                .collect(Collectors.toList());

        BigDecimal totalAmount = orderItems.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discountAmount = calculateDiscount(request.getCouponId(), totalAmount);
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
        orderMapper.insertOrder(order);
        for (OrderItem item : orderItems) {
            orderMapper.insertOrderItem(order.getId(), item);
        }
        cartMapper.clear(userId);
        return order;
    }

    @Transactional
    public Order cancelOrder(String userId, String orderId) {
        Order order = getOrder(userId, orderId);
        if ("COMPLETED".equals(order.getStatus())) {
            throw new BusinessException(400, "已完成订单不能取消");
        }
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
        orderMapper.updateStatus(orderId, "CANCELED");
        return getOrderForAdmin(orderId);
    }

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
        order.setItems(orderMapper.listOrderItems(order.getId()));
        return order;
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

    private BigDecimal calculateDiscount(String couponId, BigDecimal totalAmount) {
        if (!StringUtils.hasText(couponId)) {
            return BigDecimal.ZERO;
        }
        Coupon coupon = storeMapper.listCoupons().stream()
                .filter(item -> item.getId().equals(couponId) && item.isAvailable())
                .findFirst()
                .orElseThrow(() -> new BusinessException(404, "优惠券不存在"));
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
