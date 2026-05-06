package com.unmanned.ordering.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FrontendResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Spring Boot 是从 backend 目录启动的。
        // 前台 H5、admin、css、js、images 都在 backend 的上一级目录。
        // 所以这里先拿到 backend 目录，再通过 getParent() 找到项目根目录。
        Path backendDir = Paths.get(System.getProperty("user.dir")).toAbsolutePath();
        Path frontendDir = backendDir.getParent();
        if (frontendDir == null) {
            return;
        }

        // 把根目录下的前台 H5 页面交给 Spring Boot 托管。
        // 这样浏览器可以访问 http://127.0.0.1:8080/menu.html。
        registry.addResourceHandler(
                        "/index.html",
                        "/menu.html",
                        "/detail.html",
                        "/cart.html",
                        "/submit-order.html",
                        "/order.html",
                        "/mine.html",
                        "/saving-card.html")
                .addResourceLocations(frontendDir.toUri().toString());

        // 映射前台公共样式、脚本、图片资源。
        registry.addResourceHandler("/css/**")
                .addResourceLocations(frontendDir.resolve("css").toUri().toString());
        registry.addResourceHandler("/js/**")
                .addResourceLocations(frontendDir.resolve("js").toUri().toString());
        registry.addResourceHandler("/images/**")
                .addResourceLocations(frontendDir.resolve("images").toUri().toString());
        // 映射后台管理页面，例如 /admin/login.html。
        registry.addResourceHandler("/admin/**")
                .addResourceLocations(frontendDir.resolve("admin").toUri().toString());
    }
}
