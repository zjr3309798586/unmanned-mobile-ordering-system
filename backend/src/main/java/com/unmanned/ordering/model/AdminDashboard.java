package com.unmanned.ordering.model;

import java.math.BigDecimal;

public class AdminDashboard {
    private int productCount;
    private int orderCount;
    private int cartItemCount;
    private BigDecimal orderAmount;

    public AdminDashboard() {
    }

    public AdminDashboard(int productCount, int orderCount, int cartItemCount, BigDecimal orderAmount) {
        this.productCount = productCount;
        this.orderCount = orderCount;
        this.cartItemCount = cartItemCount;
        this.orderAmount = orderAmount;
    }

    public int getProductCount() {
        return productCount;
    }

    public void setProductCount(int productCount) {
        this.productCount = productCount;
    }

    public int getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(int orderCount) {
        this.orderCount = orderCount;
    }

    public int getCartItemCount() {
        return cartItemCount;
    }

    public void setCartItemCount(int cartItemCount) {
        this.cartItemCount = cartItemCount;
    }

    public BigDecimal getOrderAmount() {
        return orderAmount;
    }

    public void setOrderAmount(BigDecimal orderAmount) {
        this.orderAmount = orderAmount;
    }
}
