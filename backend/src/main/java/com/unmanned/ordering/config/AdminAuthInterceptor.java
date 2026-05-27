package com.unmanned.ordering.config;

import com.unmanned.ordering.service.AdminAuthService;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 后台接口拦截器。
 *
 * 在 CorsConfig.addInterceptors 中注册,生效路径:
 *   addPathPatterns("/api/admin/**")        所有后台接口都拦截
 *   excludePathPatterns("/api/admin/login") 但放行登录接口本身
 *
 * 校验逻辑:每个请求必须带 X-Admin-Token 请求头,
 * 由 AdminAuthService.requireValidToken 比对 SHA-256 后的 token。
 * 不通过则抛 BusinessException(401),由全局异常处理器转成 HTTP 401。
 */
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {
    private final AdminAuthService adminAuthService;

    public AdminAuthInterceptor(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 浏览器跨域预检请求(OPTIONS)不带 token,这里直接放行,
        // 否则前端的正式 POST/PATCH 请求会被卡在预检阶段。
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        // token 错误时,AdminAuthService 会抛 BusinessException(401),
        // 全局异常处理器会返回 401 + 友好错误信息。
        adminAuthService.requireValidToken(request.getHeader("X-Admin-Token"));
        return true;
    }
}
