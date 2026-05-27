package com.unmanned.ordering.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 购物车页接口返回结构(包装多项 + 汇总)。
 *
 * 包含:
 *   items          购物车明细列表
 *   totalQuantity  总件数(用于点餐页底部"已选 X 件")
 *   totalAmount    总金额(用于购物车页支付条)
 *   hint           前端展示用的提示文案
 */
public class CartSummary {
    private List<CartItem> items = new ArrayList<>();
    private int totalQuantity;
    private BigDecimal totalAmount;
    private String discountHint;

    public CartSummary() {
    }

    public CartSummary(List<CartItem> items, int totalQuantity, BigDecimal totalAmount, String discountHint) {
        this.items = items == null ? new ArrayList<>() : items;
        this.totalQuantity = totalQuantity;
        this.totalAmount = totalAmount;
        this.discountHint = discountHint;
    }

    public List<CartItem> getItems() {
        return items;
    }

    public void setItems(List<CartItem> items) {
        this.items = items == null ? new ArrayList<>() : items;
    }

    public int getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(int totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getDiscountHint() {
        return discountHint;
    }

    public void setDiscountHint(String discountHint) {
        this.discountHint = discountHint;
    }
}
