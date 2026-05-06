package com.unmanned.ordering.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

// 负责把根路径 / 转到前台首页。
@Controller
public class FrontendController {
    // 用户访问 http://127.0.0.1:8080/ 时，实际返回 index.html。
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
}
