package com.unmanned.ordering.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 前台页面路由 —— 唯一作用是把根路径 / 转发到首页。
 *
 * 注意:这个类不是 @RestController(没有 Rest),返回的是字符串 "forward:/index.html",
 * 由 Spring MVC 的视图解析器解释为"内部转发"(URL 不变,后端去找 /index.html 的资源)。
 *
 * 因为 FrontendResourceConfig 把 /index.html 映射到了 h5/pages/index.html,
 * 所以最终用户访问 http://localhost:8080/ 就能看到首页。
 */
@Controller
public class FrontendController {
    /** 根路径 → 首页。等价于 CorsConfig 里 addViewController 的写法,二选一即可。 */
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
}
