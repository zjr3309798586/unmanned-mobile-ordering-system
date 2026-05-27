package com.unmanned.ordering.request;

import java.math.BigDecimal;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

// 后台新增 / 修改优惠券时，页面表单提交的数据结构。

/**
 * 新增/修改优惠券请求体(后台用)。
 *
 * 字段:
 *   title           券标题
 *   conditionText   满减说明文案(如"满 20 减 5")
 *   minAmount       满减门槛
 *   discountAmount  抵扣金额
 *   validUntil      有效期截止时间
 *   available       是否启用
 */
public class CouponRequest {
    // 优惠券名称，例如“满 30 减 6”。
    @NotBlank
    private String title;

    // 展示给用户看的使用条件文字。
    @NotBlank
    private String conditionText;

    // 使用门槛，订单金额达到这个值才可以使用。
    @NotNull
    @DecimalMin("0.00")
    private BigDecimal minAmount = BigDecimal.ZERO;

    // 优惠金额，必须大于等于 0.01。
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal discountAmount;

    // 有效期文字，目前用字符串方便大二课程项目理解和维护。
    @NotBlank
    private String validUntil;

    // true 表示可领取 / 可使用，false 表示后台已下架。
    private boolean available = true;

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
