package com.unmanned.ordering.model;

import java.math.BigDecimal;

/**
 * 后台首页数据看板的统计 DTO。
 *
 * 由 OrderingService.getDashboard 组装,包含:
 *   - productCount: 上架商品数
 *   - orderCount: 总订单数
 *   - cartItemCount: 全平台购物车条目数
 *   - totalOrderAmount: 已成交订单总金额(已取消订单不计入)
 */
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
