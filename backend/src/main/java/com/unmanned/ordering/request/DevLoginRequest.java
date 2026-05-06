package com.unmanned.ordering.request;

// H5 开发登录请求。浏览器没有 wx.login，所以用这个接口模拟一个真实用户。
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
