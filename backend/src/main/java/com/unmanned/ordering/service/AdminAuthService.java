package com.unmanned.ordering.service;

import com.unmanned.ordering.exception.BusinessException;
import com.unmanned.ordering.model.AdminSession;
import com.unmanned.ordering.request.AdminLoginRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * 后台管理员登录服务。
 *
 * 设计选择:这个项目为了简单易懂,后台账号密码先放在 application.yml 里,
 * 没有单独建 admin 表。生产环境应该改为:管理员表 + bcrypt 哈希 + 角色权限。
 *
 * Token 机制:
 *   - token = SHA-256(username + ":" + password + ":" + tokenSecret)
 *   - 后台登录成功返回这个 token
 *   - 后台页面把 token 放到 X-Admin-Token 请求头
 *   - AdminAuthInterceptor 拦截 /api/admin/** 接口校验 token
 *   - 改密码或重启服务后,旧 token 自动失效(因为 hash 输入变了)
 */
@Service
public class AdminAuthService {
    private final String username;       // 后台账号,默认 "admin"
    private final String password;       // 后台密码,默认 "admin123"
    private final String tokenSecret;    // 加密盐,正式环境必须改成强随机串

    public AdminAuthService(
            @Value("${admin.username}") String username,
            @Value("${admin.password}") String password,
            @Value("${admin.token-secret}") String tokenSecret) {
        this.username = username;
        this.password = password;
        this.tokenSecret = tokenSecret;
    }

    /**
     * 后台登录。
     * 账号密码正确就返回管理员 token,后台页面之后把 token 放到 X-Admin-Token 请求头。
     *
     * @throws BusinessException 401 账号或密码错误
     */
    public AdminSession login(AdminLoginRequest request) {
        if (!username.equals(request.getUsername()) || !password.equals(request.getPassword())) {
            throw new BusinessException(401, "账号或密码错误");
        }
        return new AdminSession(username, buildToken());
    }

    /**
     * 后台接口保护:没有 token 或 token 不正确,就拒绝访问。
     * AdminAuthInterceptor 拦截所有 /api/admin/** 接口都会调用这里。
     */
    public void requireValidToken(String token) {
        if (!isValidToken(token)) {
            throw new BusinessException(401, "请先登录后台");
        }
    }

    /**
     * 安全地比较 token。
     * 用 MessageDigest.isEqual 而不是普通的 equals,是为了防御"时序攻击":
     * 普通 equals 在第一个不同字节就返回,攻击者可以通过比较时间差猜密码。
     */
    private boolean isValidToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        byte[] expected = buildToken().getBytes(StandardCharsets.UTF_8);
        byte[] actual = token.trim().getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, actual);
    }

    /** Token = SHA-256(username:password:tokenSecret) */
    private String buildToken() {
        return sha256(username + ":" + password + ":" + tokenSecret);
    }

    /** 标准 SHA-256 哈希,输出 64 位小写十六进制字符串。 */
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
            // SHA-256 是 JDK 内置的,理论上不会找不到。
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }
}
