package com.unmanned.ordering.model;

import java.math.BigDecimal;

/**
 * 用户会员资料,对应 user_profiles 表。
 *
 * 一对一关联 users(user_id 主键)。展示用字段:
 *   memberLevel    会员等级("普通会员" / "省钱卡会员")
 *   points         积分(下单 +,取消订单 -)
 *   balance        余额(预留,当前未启用支付)
 *   couponCount    可用券数量(领/用券后自动刷新)
 *   savingAmount   累计已节省金额
 */
public class UserProfile {
    private String userId;
    private String nickname;
    private String memberLevel;
    private int points;
    private BigDecimal balance;
    private int couponCount;
    private BigDecimal savingAmount;

    public UserProfile() {
    }

    public UserProfile(String userId, String nickname, String memberLevel, int points,
                       BigDecimal balance, int couponCount, BigDecimal savingAmount) {
        this.userId = userId;
        this.nickname = nickname;
        this.memberLevel = memberLevel;
        this.points = points;
        this.balance = balance;
        this.couponCount = couponCount;
        this.savingAmount = savingAmount;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getMemberLevel() {
        return memberLevel;
    }

    public void setMemberLevel(String memberLevel) {
        this.memberLevel = memberLevel;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public int getCouponCount() {
        return couponCount;
    }

    public void setCouponCount(int couponCount) {
        this.couponCount = couponCount;
    }

    public BigDecimal getSavingAmount() {
        return savingAmount;
    }

    public void setSavingAmount(BigDecimal savingAmount) {
        this.savingAmount = savingAmount;
    }
}
