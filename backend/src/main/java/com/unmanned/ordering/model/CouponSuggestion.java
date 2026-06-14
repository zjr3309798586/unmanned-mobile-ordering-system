package com.unmanned.ordering.model;

import java.math.BigDecimal;

public class CouponSuggestion {
    private UserCoupon coupon;
    private boolean usable;
    private BigDecimal gapAmount;
    private BigDecimal discountAmount;
    private String reason;

    public CouponSuggestion() {
    }

    public CouponSuggestion(UserCoupon coupon, boolean usable, BigDecimal gapAmount,
                            BigDecimal discountAmount, String reason) {
        this.coupon = coupon;
        this.usable = usable;
        this.gapAmount = gapAmount;
        this.discountAmount = discountAmount;
        this.reason = reason;
    }

    public UserCoupon getCoupon() {
        return coupon;
    }

    public void setCoupon(UserCoupon coupon) {
        this.coupon = coupon;
    }

    public boolean isUsable() {
        return usable;
    }

    public void setUsable(boolean usable) {
        this.usable = usable;
    }

    public BigDecimal getGapAmount() {
        return gapAmount;
    }

    public void setGapAmount(BigDecimal gapAmount) {
        this.gapAmount = gapAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
