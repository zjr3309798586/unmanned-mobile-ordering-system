package com.unmanned.ordering.service;

import com.unmanned.ordering.exception.BusinessException;
import com.unmanned.ordering.model.AdminSession;
import com.unmanned.ordering.request.AdminLoginRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

// 后台管理员登录服务。
// 这个项目为了简单易懂，后台账号密码先放在 application.yml 里，没有单独建 admin 表。
@Service
public class AdminAuthService {
    private final String username;
    private final String password;
    private final String tokenSecret;

    public AdminAuthService(
            @Value("${admin.username}") String username,
            @Value("${admin.password}") String password,
            @Value("${admin.token-secret}") String tokenSecret) {
        this.username = username;
        this.password = password;
        this.tokenSecret = tokenSecret;
    }

    // 后台登录：账号密码正确就返回管理员 token，后台页面之后会把 token 放到 X-Admin-Token 请求头。
    public AdminSession login(AdminLoginRequest request) {
        if (!username.equals(request.getUsername()) || !password.equals(request.getPassword())) {
            throw new BusinessException(401, "账号或密码错误");
        }
        return new AdminSession(username, buildToken());
    }

    // 后台接口保护：没有 token 或 token 不正确，就不允许访问后台管理接口。
    public void requireValidToken(String token) {
        if (!isValidToken(token)) {
            throw new BusinessException(401, "请先登录后台");
        }
    }

    private boolean isValidToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        byte[] expected = buildToken().getBytes(StandardCharsets.UTF_8);
        byte[] actual = token.trim().getBytes(StandardCharsets.UTF_8);
        // MessageDigest.isEqual 比普通字符串 equals 更适合比较 token。
        return MessageDigest.isEqual(expected, actual);
    }

    // token 不直接等于密码，而是把账号、密码、密钥组合后做 SHA-256。
    private String buildToken() {
        return sha256(username + ":" + password + ":" + tokenSecret);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte item : bytes) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }
}
