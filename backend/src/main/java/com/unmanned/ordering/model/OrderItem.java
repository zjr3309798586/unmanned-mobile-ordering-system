package com.unmanned.ordering.model;

import java.math.BigDecimal;

/**
 * 订单明细单项,对应 order_items 表。
 *
 * 这是"下单时的商品快照":productName / spec / price 在下单瞬间冻结,
 * 之后商品改名或改价都不影响历史订单。
 *
 * subtotal = price × quantity,由 getter 计算。
 */
public class OrderItem {
    private String productId;
    private String productName;
    private String spec;
    private BigDecimal price;
    private int quantity;

    public OrderItem() {
    }

    public OrderItem(String productId, String productName, String spec, BigDecimal price, int quantity) {
        this.productId = productId;
        this.productName = productName;
        this.spec = spec;
        this.price = price;
        this.quantity = quantity;
    }

    public BigDecimal getSubtotal() {
        return price.multiply(BigDecimal.valueOf(quantity));
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getSpec() {
        return spec;
    }

    public void setSpec(String spec) {
        this.spec = spec;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
