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

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserAuthService userAuthService;

    public AuthController(UserAuthService userAuthService) {
        this.userAuthService = userAuthService;
    }

    @PostMapping("/dev-login")
    public ApiResponse<UserSession> devLogin(@RequestBody(required = false) DevLoginRequest request) {
        return ApiResponse.ok(userAuthService.devLogin(request));
    }

    @PostMapping("/wechat-login")
    public ApiResponse<UserSession> wechatLogin(@Valid @RequestBody WechatLoginRequest request) {
        return ApiResponse.ok(userAuthService.wechatLogin(request));
    }

    @GetMapping("/me")
    public ApiResponse<UserProfile> me(@RequestHeader(value = "X-User-Token", required = false) String token) {
        return ApiResponse.ok(userAuthService.getProfile(token));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(value = "X-User-Token", required = false) String token) {
        userAuthService.logout(token);
        return ApiResponse.ok(null);
    }
}
