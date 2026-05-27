package com.unmanned.ordering.model;

import java.math.BigDecimal;

/**
 * 购物车单项实体,对应 cart_items 表(经 JOIN products 后)。
 *
 * 数据库表里只存 product_id + spec + quantity,
 * 商品名 / 图 / 价 通过 JOIN products 实时拿,保证商品改价时购物车价格也更新。
 *
 * subtotal = price × quantity,由 getter 计算,不存表。
 */
public class CartItem {
    private String id;
    private String productId;
    private String productName;
    private String spec;
    private String image;
    private BigDecimal price;
    private int quantity;

    public CartItem() {
    }

    public CartItem(String id, String productId, String productName, String spec,
                    String image, BigDecimal price, int quantity) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.spec = spec;
        this.image = image;
        this.price = price;
        this.quantity = quantity;
    }

    public BigDecimal getSubtotal() {
        return price.multiply(BigDecimal.valueOf(quantity));
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
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
