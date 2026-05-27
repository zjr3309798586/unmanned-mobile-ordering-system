package com.unmanned.ordering.model;

/**
 * 后台管理员登录后返回给前端的会话信息。
 *
 * 包含 username(显示用)+ token(后续接口的 X-Admin-Token 请求头)。
 */
public class AdminSession {
    private String username;
    private String token;

    public AdminSession() {
    }

    public AdminSession(String username, String token) {
        this.username = username;
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
