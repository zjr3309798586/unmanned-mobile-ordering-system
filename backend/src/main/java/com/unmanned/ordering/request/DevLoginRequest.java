package com.unmanned.ordering.request;

// H5 游客登录请求。浏览器没有 wx.login，所以用这个接口创建游客会话。

/**
 * H5 游客登录请求体。
 * 只有 nickname 一个可选字段,不传则默认"游客用户"。
 */
public class DevLoginRequest {
    // 可选昵称。不传时后端会默认叫“游客用户”。
    private String nickname;

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
}
