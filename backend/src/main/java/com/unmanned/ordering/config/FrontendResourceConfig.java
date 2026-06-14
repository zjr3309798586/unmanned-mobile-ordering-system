package com.unmanned.ordering.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 静态资源路径映射(与 CorsConfig.addResourceHandlers 功能重叠的备份)。
 *
 * Spring 会调用所有 WebMvcConfigurer 的 addResourceHandlers,
 * 多个注册会按顺序匹配,CorsConfig 的实现先生效;本类作为兜底配置存在。
 *
 * 同样把 / index.html / css / js / images 映射到 h5/ 子目录,
 * 把 /admin/** 映射到项目根的 admin/ 目录。
 *
 * 用 Path API 而不是 "file:../" 字符串拼接,更稳健,跨操作系统都能工作。
 */
@Configuration
public class FrontendResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Spring Boot 是从 backend 目录启动的。
        // 前台 H5(h5/pages、h5/css、h5/js、h5/images)与 admin 都在 backend 的上一级目录。
        // 这里先拿到 backend 目录，再通过 getParent() 找到项目根目录。
        Path backendDir = Paths.get(System.getProperty("user.dir")).toAbsolutePath();
        Path projectRoot = backendDir.getParent();
        if (projectRoot == null) {
            return;
        }
        Path h5Dir = projectRoot.resolve("h5");

        // 把 h5/pages 下的前台页面映射到根 URL,
        // 这样浏览器仍可访问 http://127.0.0.1:8080/menu.html。
        registry.addResourceHandler(
                        "/index.html",
                        "/menu.html",
                        "/detail.html",
                        "/cart.html",
                        "/order.html",
                        "/mine.html",
                        "/address.html",
                        "/favorites.html",
                        "/support.html",
                        "/saving-card.html")
                .addResourceLocations(h5Dir.resolve("pages").toUri().toString());

        // 映射前台公共样式、脚本、图片资源(均在 h5/ 下)。
        registry.addResourceHandler("/css/**")
                .addResourceLocations(h5Dir.resolve("css").toUri().toString());
        registry.addResourceHandler("/js/**")
                .addResourceLocations(h5Dir.resolve("js").toUri().toString());
        registry.addResourceHandler("/images/**")
                .addResourceLocations(h5Dir.resolve("images").toUri().toString());
        // 映射后台管理页面，例如 /admin/login.html。
        registry.addResourceHandler("/admin/**")
                .addResourceLocations(projectRoot.resolve("admin").toUri().toString());
    }
}
