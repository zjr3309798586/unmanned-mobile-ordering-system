package com.unmanned.ordering.model;

import java.math.BigDecimal;

/**
 * 优惠券规则实体,对应 coupons 表。
 *
 * 字段说明:
 *   minAmount        满减门槛(订单金额需 >= 才可用)
 *   discountAmount   抵扣金额
 *   validUntil       有效期(过期券不能使用)
 *   available        是否启用(后台软删除标志)
 *
 * 这是"券规则",不是某个用户领的券。用户领后会写入 user_coupons 表。
 */
public class Coupon {
    private String id;
    private String title;
    private String conditionText;
    private BigDecimal minAmount;
    private BigDecimal discountAmount;
    private String validUntil;
    private boolean available;

    public Coupon() {
    }

    public Coupon(String id, String title, String conditionText, BigDecimal minAmount, BigDecimal discountAmount,
                  String validUntil, boolean available) {
        this.id = id;
        this.title = title;
        this.conditionText = conditionText;
        this.minAmount = minAmount;
        this.discountAmount = discountAmount;
        this.validUntil = validUntil;
        this.available = available;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getConditionText() {
        return conditionText;
    }

    public void setConditionText(String conditionText) {
        this.conditionText = conditionText;
    }

    public BigDecimal getMinAmount() {
        return minAmount;
    }

    public void setMinAmount(BigDecimal minAmount) {
        this.minAmount = minAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public String getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(String validUntil) {
        this.validUntil = validUntil;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}
