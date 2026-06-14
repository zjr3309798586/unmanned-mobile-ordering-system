package com.unmanned.ordering.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 订单实体,对应 orders 主表(items 字段来自 order_items 子表)。
 *
 * 关键金额字段(都是 BigDecimal,避免浮点精度问题):
 *   totalAmount      商品总价
 *   discountAmount   优惠金额(=> 来自所用优惠券)
 *   payableAmount    实付金额 = total - discount,最低为 0
 *
 * status 取值:
 *   MAKING           制作中(提交订单后的初始状态)
 *   WAITING_PICKUP   待取餐(店员标记出餐后)
 *   DELIVERING       配送中(外送订单出餐后)
 *   COMPLETED        已完成(店员标记)
 *   CANCELED         已取消(用户或店员)
 *
 * pickupType:取餐方式("SELF_PICKUP" / "DELIVERY" 等)。
 */
public class Order {
    private String id;
    private String userId;
    private String orderNo;
    private String pickupType;
    private String storeName;
    private String tableNo;
    private String deliveryAddress;
    private String deliveryContact;
    private BigDecimal deliveryFee = BigDecimal.ZERO;
    private String remark;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal payableAmount;
    private LocalDateTime createdAt;
    private List<OrderItem> items = new ArrayList<>();

    public Order() {
    }

    public Order(String id, String orderNo, String pickupType, String storeName, String tableNo, String remark,
                 String status, BigDecimal totalAmount, BigDecimal discountAmount, BigDecimal payableAmount,
                 LocalDateTime createdAt, List<OrderItem> items) {
        this.id = id;
        this.orderNo = orderNo;
        this.pickupType = pickupType;
        this.storeName = storeName;
        this.tableNo = tableNo;
        this.remark = remark;
        this.status = status;
        this.totalAmount = totalAmount;
        this.discountAmount = discountAmount;
        this.payableAmount = payableAmount;
        this.createdAt = createdAt;
        this.items = items == null ? new ArrayList<>() : items;
    }

    public Order(String id, String userId, String orderNo, String pickupType, String storeName, String tableNo,
                 String remark, String status, BigDecimal totalAmount, BigDecimal discountAmount,
                 BigDecimal payableAmount, LocalDateTime createdAt, List<OrderItem> items) {
        this(id, orderNo, pickupType, storeName, tableNo, remark, status, totalAmount,
                discountAmount, payableAmount, createdAt, items);
        this.userId = userId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getPickupType() {
        return pickupType;
    }

    public void setPickupType(String pickupType) {
        this.pickupType = pickupType;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getTableNo() {
        return tableNo;
    }

    public void setTableNo(String tableNo) {
        this.tableNo = tableNo;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getDeliveryContact() {
        return deliveryContact;
    }

    public void setDeliveryContact(String deliveryContact) {
        this.deliveryContact = deliveryContact;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee == null ? BigDecimal.ZERO : deliveryFee;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getPayableAmount() {
        return payableAmount;
    }

    public void setPayableAmount(BigDecimal payableAmount) {
        this.payableAmount = payableAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items == null ? new ArrayList<>() : items;
    }
}
