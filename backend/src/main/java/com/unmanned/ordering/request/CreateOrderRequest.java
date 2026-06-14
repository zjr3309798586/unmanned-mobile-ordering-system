package com.unmanned.ordering.request;

import javax.validation.constraints.NotBlank;

// 提交订单时，前端传给后端的数据结构。

/**
 * 提交订单请求体。
 *
 * 前端只提交:
 *   pickupType    取餐方式("SELF_PICKUP"/"DELIVERY")
 *   couponId      用的优惠券 ID(可空)
 *   tableNo       桌号(可空)
 *   remark        备注(可空)
 *
 * 商品清单不由前端传,后端直接读取当前用户购物车,防价格篡改。
 */
public class CreateOrderRequest {
    // 必填：取餐方式，例如 PICKUP 表示到店自取，DELIVERY 表示外送。
    @NotBlank
    private String pickupType;

    // 可选：用户选择使用的优惠券 id。不传就表示不用券。
    private String couponId;

    // 可选：堂食桌号或取餐号。
    private String tableNo;

    // 可选：外送地址。pickupType=DELIVERY 时必填。
    private String deliveryAddress;

    // 可选：外送联系电话。pickupType=DELIVERY 时必填。
    private String deliveryContact;

    // 可选：订单备注，例如“少冰”“不要吸管”。
    private String remark;

    public String getPickupType() {
        return pickupType;
    }

    public void setPickupType(String pickupType) {
        this.pickupType = pickupType;
    }

    public String getCouponId() {
        return couponId;
    }

    public void setCouponId(String couponId) {
        this.couponId = couponId;
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

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
