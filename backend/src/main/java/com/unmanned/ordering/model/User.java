package com.unmanned.ordering.model;

import java.time.LocalDateTime;

/**
 * 用户登录会话实体,对应 users 表。
 *
 * 一个 User 唯一标识一个用户,字段:
 *   openid       微信 openid(devLogin 时为 null)
 *   nickname     昵称
 *   avatarUrl    头像
 *   token        当前登录 token(退出登录时清空,过期前一直有效)
 *
 * 注意区分:User 是"登录会话",UserProfile 是"会员资料",
 * 一对一关联(user_id 外键)。
 */
public class User {
    private String id;
    private String openid;
    private String nickname;
    private String avatarUrl;
    private String token;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {
    }

    public User(String id, String openid, String nickname, String avatarUrl, String token,
                LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.openid = openid;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.token = token;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOpenid() {
        return openid;
    }

    public void setOpenid(String openid) {
        this.openid = openid;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
