package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 健康检查接口。
 *
 * 唯一端点:GET /api/health → 返回 status=UP + 服务名 + 当前时间。
 * 浏览器或运维监控可以用这个端点判断后端是否启动成功。
 */
@RestController
public class HealthController {

    /** 返回 UP 即表示后端服务已经启动成功。运维探活通常每 5-30 秒探一次。 */
    @GetMapping("/api/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("status", "UP");
        data.put("service", "unmanned-mobile-ordering-backend");
        data.put("time", LocalDateTime.now());
        return ApiResponse.ok(data);
    }
}
