package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.UserProfile;
import com.unmanned.ordering.model.UserSession;
import com.unmanned.ordering.request.DevLoginRequest;
import com.unmanned.ordering.request.WechatLoginRequest;
import com.unmanned.ordering.service.UserAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

/**
 * 前台用户登录相关接口。
 *
 * 共 4 个端点:
 *   POST /api/auth/dev-login     —— H5 游客登录
 *   POST /api/auth/wechat-login  —— 微信小程序登录
 *   GET  /api/auth/me            —— 查当前用户资料(需要 token)
 *   POST /api/auth/logout        —— 退出登录(需要 token)
 *
 * 业务逻辑全部交给 UserAuthService 处理,这里只负责接收请求和返回 ApiResponse。
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserAuthService userAuthService;

    public AuthController(UserAuthService userAuthService) {
        this.userAuthService = userAuthService;
    }

    /**
     * H5 游客登录:浏览器端没有 wx.login,因此使用游客会话完成点餐流程。
     * 正式微信小程序端仍走 /wechat-login。
     */
    @PostMapping("/dev-login")
    public ApiResponse<UserSession> devLogin(@RequestBody(required = false) DevLoginRequest request) {
        return ApiResponse.ok(userAuthService.devLogin(request));
    }

    /**
     * 微信小程序登录:小程序前端拿到 wx.login() 的 code 后提交到这里。
     * 后端用 code + AppID + AppSecret 调微信接口换 openid 完成身份识别。
     */
    @PostMapping("/wechat-login")
    public ApiResponse<UserSession> wechatLogin(@Valid @RequestBody WechatLoginRequest request) {
        return ApiResponse.ok(userAuthService.wechatLogin(request));
    }

    /** 获取当前用户资料。X-User-Token 是登录接口返回的 token。 */
    @GetMapping("/me")
    public ApiResponse<UserProfile> me(@RequestHeader(value = "X-User-Token", required = false) String token) {
        return ApiResponse.ok(userAuthService.getProfile(token));
    }

    /** 退出登录:把数据库里的 token 清空,之后前端的 token 就无效。 */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(value = "X-User-Token", required = false) String token) {
        userAuthService.logout(token);
        return ApiResponse.ok(null);
    }
}
