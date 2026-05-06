package com.unmanned.ordering.config;

import com.unmanned.ordering.service.AdminAuthService;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

// 后台接口拦截器。
// 作用：除了 /api/admin/login，其他 /api/admin/** 接口都必须带正确的 X-Admin-Token。
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {
    private final AdminAuthService adminAuthService;

    public AdminAuthInterceptor(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 浏览器跨域预检请求不做登录校验，否则前端可能无法正常发送正式请求。
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        // token 错误时，AdminAuthService 会抛 BusinessException，统一异常处理器会返回 401。
        adminAuthService.requireValidToken(request.getHeader("X-Admin-Token"));
        return true;
    }
}
