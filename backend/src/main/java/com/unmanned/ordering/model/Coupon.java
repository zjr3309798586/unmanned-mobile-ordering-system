package com.unmanned.ordering.model;

import java.math.BigDecimal;

public class Coupon {
    private String id;
    private String title;
    private String conditionText;
    private BigDecimal discountAmount;
    private String validUntil;
    private boolean available;

    public Coupon() {
    }

    public Coupon(String id, String title, String conditionText, BigDecimal discountAmount,
                  String validUntil, boolean available) {
        this.id = id;
        this.title = title;
        this.conditionText = conditionText;
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
