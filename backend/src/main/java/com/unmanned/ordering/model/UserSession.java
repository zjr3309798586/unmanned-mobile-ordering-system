package com.unmanned.ordering.model;

/**
 * 用户登录后返回给前端的会话信息。
 *
 * 包含 userId / nickname / avatarUrl / token / loginType,
 * 前端拿到后:把 token 存本地,以后每次请求带 X-User-Token 请求头。
 *
 * loginType 取值:
 *   GUEST    H5 游客登录(devLogin)
 *   WECHAT   微信小程序登录
 */
public class UserSession {
    private String userId;
    private String nickname;
    private String avatarUrl;
    private String token;
    private String loginType;

    public UserSession() {
    }

    public UserSession(String userId, String nickname, String avatarUrl, String token, String loginType) {
        this.userId = userId;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.token = token;
        this.loginType = loginType;
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

    public String getLoginType() {
        return loginType;
    }

    public void setLoginType(String loginType) {
        this.loginType = loginType;
    }
}
