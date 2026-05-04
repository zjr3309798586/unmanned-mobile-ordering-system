package com.unmanned.ordering.service;

import com.unmanned.ordering.exception.BusinessException;
import com.unmanned.ordering.mapper.CartMapper;
import com.unmanned.ordering.mapper.OrderMapper;
import com.unmanned.ordering.mapper.ProductMapper;
import com.unmanned.ordering.mapper.StoreMapper;
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

    public OrderingService(StoreMapper storeMapper, ProductMapper productMapper,
                           CartMapper cartMapper, OrderMapper orderMapper) {
        this.storeMapper = storeMapper;
        this.productMapper = productMapper;
        this.cartMapper = cartMapper;
        this.orderMapper = orderMapper;
    }

    public Store getStore() {
        Store store = storeMapper.findStore();
        if (store == null) {
            throw new BusinessException(404, "Store not found");
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
            throw new BusinessException(404, "Product not found");
        }
        return product;
    }

    public List<Coupon> listCoupons() {
        return storeMapper.listCoupons();
    }

    public List<SavingCardPlan> listSavingCardPlans() {
        return storeMapper.listSavingCardPlans();
    }

    public UserProfile getUserProfile() {
        UserProfile userProfile = storeMapper.findUserProfile();
        if (userProfile == null) {
            throw new BusinessException(404, "User profile not found");
        }
        return userProfile;
    }

    public CartSummary getCartSummary() {
        List<CartItem> items = cartMapper.listCartItems();
        int totalQuantity = items.stream().mapToInt(CartItem::getQuantity).sum();
        BigDecimal totalAmount = items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartSummary(items, totalQuantity, totalAmount, "Use coupons at checkout when available.");
    }

    @Transactional
    public CartSummary addCartItem(AddCartItemRequest request) {
        Product product = getProduct(request.getProductId());
        String spec = normalizeSpec(request.getSpec());
        CartItem existingItem = cartMapper.findByProductAndSpec(product.getId(), spec);

        if (existingItem != null) {
            cartMapper.increaseQuantity(existingItem.getId(), request.getQuantity());
        } else {
            cartMapper.insert(newId("CART"), product.getId(), spec, request.getQuantity());
        }
        return getCartSummary();
    }

    @Transactional
    public CartSummary updateCartItem(String itemId, int quantity) {
        if (cartMapper.updateQuantity(itemId, quantity) == 0) {
            throw new BusinessException(404, "Cart item not found");
        }
        return getCartSummary();
    }

    @Transactional
    public CartSummary deleteCartItem(String itemId) {
        if (cartMapper.deleteById(itemId) == 0) {
            throw new BusinessException(404, "Cart item not found");
        }
        return getCartSummary();
    }

    @Transactional
    public CartSummary clearCart() {
        cartMapper.clear();
        return getCartSummary();
    }

    public List<Order> listOrders(String status) {
        return orderMapper.listOrders(status).stream()
                .map(this::attachOrderItems)
                .collect(Collectors.toList());
    }

    public Order getOrder(String orderId) {
        Order order = orderMapper.findOrder(orderId);
        if (order == null) {
            throw new BusinessException(404, "Order not found");
        }
        return attachOrderItems(order);
    }

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        List<CartItem> cartItems = cartMapper.listCartItems();
        if (cartItems.isEmpty()) {
            throw new BusinessException(400, "Cart is empty");
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
        cartMapper.clear();
        return order;
    }

    @Transactional
    public Order cancelOrder(String orderId) {
        Order order = getOrder(orderId);
        if ("COMPLETED".equals(order.getStatus())) {
            throw new BusinessException(400, "Completed orders cannot be canceled");
        }
        orderMapper.updateStatus(orderId, "CANCELED");
        return getOrder(orderId);
    }

    @Transactional
    public CartSummary repeatOrder(String orderId) {
        Order order = getOrder(orderId);
        for (OrderItem item : order.getItems()) {
            AddCartItemRequest request = new AddCartItemRequest();
            request.setProductId(item.getProductId());
            request.setSpec(item.getSpec());
            request.setQuantity(item.getQuantity());
            addCartItem(request);
        }
        return getCartSummary();
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
            throw new BusinessException(404, "Product not found");
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
            throw new BusinessException(404, "Product not found");
        }
        productMapper.disable(productId);
        return productMapper.findById(productId);
    }

    private Order attachOrderItems(Order order) {
        order.setItems(orderMapper.listOrderItems(order.getId()));
        return order;
    }

    private void ensureCategoryExists(String categoryId) {
        if (storeMapper.countCategory(categoryId) == 0) {
            throw new BusinessException(404, "Category not found");
        }
    }

    private BigDecimal calculateDiscount(String couponId, BigDecimal totalAmount) {
        if (!StringUtils.hasText(couponId)) {
            return BigDecimal.ZERO;
        }
        Coupon coupon = storeMapper.listCoupons().stream()
                .filter(item -> item.getId().equals(couponId) && item.isAvailable())
                .findFirst()
                .orElseThrow(() -> new BusinessException(404, "Coupon not found"));
        return coupon.getDiscountAmount().min(totalAmount);
    }

    private String normalizeSpec(String spec) {
        return StringUtils.hasText(spec) ? spec.trim() : "Regular";
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

    private String defaultText(String value) {
        return StringUtils.hasText(value) ? value.trim() : "";
    }

    private String defaultImage(String value) {
        return StringUtils.hasText(value) ? value.trim() : "/images/product-default.svg";
    }
}
