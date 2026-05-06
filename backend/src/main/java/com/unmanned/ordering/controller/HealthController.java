package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    // 健康检查接口。能访问 /api/health 并返回 UP，说明后端服务已经启动成功。
    @GetMapping("/api/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("status", "UP");
        data.put("service", "unmanned-mobile-ordering-backend");
        data.put("time", LocalDateTime.now());
        return ApiResponse.ok(data);
    }
}
