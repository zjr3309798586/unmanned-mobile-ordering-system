package com.unmanned.ordering.request;

import javax.validation.constraints.NotBlank;

// 小程序微信登录请求。小程序端通过 wx.login 拿到 code 后提交给后端。

/**
 * 微信小程序登录请求体。
 *
 * 字段:
 *   code        小程序 wx.login() 返回的一次性 code
 *   nickname    用户昵称(可空,默认"微信用户")
 *   avatarUrl   头像 URL(可空)
 *
 * code 由后端拿去微信换 openid。
 */
public class WechatLoginRequest {
    // 必填：wx.login 返回的临时登录凭证。
    @NotBlank
    private String code;

    // 可选：微信昵称和头像地址，后端会保存到用户资料里。
    private String nickname;
    private String avatarUrl;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
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
}
