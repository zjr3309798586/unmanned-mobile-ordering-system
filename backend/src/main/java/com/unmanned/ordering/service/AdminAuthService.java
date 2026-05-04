package com.unmanned.ordering.service;

import com.unmanned.ordering.exception.BusinessException;
import com.unmanned.ordering.model.AdminSession;
import com.unmanned.ordering.request.AdminLoginRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

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

    public AdminSession login(AdminLoginRequest request) {
        if (!username.equals(request.getUsername()) || !password.equals(request.getPassword())) {
            throw new BusinessException(401, "账号或密码错误");
        }
        return new AdminSession(username, buildToken());
    }

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
        return MessageDigest.isEqual(expected, actual);
    }

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
