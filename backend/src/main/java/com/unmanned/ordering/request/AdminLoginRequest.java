package com.unmanned.ordering.request;

import javax.validation.constraints.NotBlank;

// 后台管理员登录表单。

/**
 * 后台管理员登录请求体。
 * 字段:username + password,由 AdminAuthService.login 校验。
 */
public class AdminLoginRequest {
    // 管理员账号，配置在 application.yml 的 admin.username。
    @NotBlank
    private String username;

    // 管理员密码，配置在 application.yml 的 admin.password。
    @NotBlank
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
