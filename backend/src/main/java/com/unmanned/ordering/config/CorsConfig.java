package com.unmanned.ordering.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Spring MVC 配置：跨域、后台登录拦截、静态页面访问。
@Configuration
public class CorsConfig {
    private final AdminAuthInterceptor adminAuthInterceptor;

    public CorsConfig(AdminAuthInterceptor adminAuthInterceptor) {
        this.adminAuthInterceptor = adminAuthInterceptor;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // 允许前台 H5、小程序调试工具访问后端 /api/** 接口。
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }

            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                // 后台管理接口统一加登录拦截，登录接口本身排除。
                registry.addInterceptor(adminAuthInterceptor)
                        .addPathPatterns("/api/admin/**")
                        .excludePathPatterns("/api/admin/login");
            }

            @Override
            public void addViewControllers(ViewControllerRegistry registry) {
                // 访问 http://127.0.0.1:8080/ 时直接打开首页。
                registry.addViewController("/").setViewName("forward:/index.html");
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // 让 Spring Boot 能直接访问前台 H5、后台 HTML、CSS、JS、图片资源。
                // 因为服务从 backend 目录启动，所以 file:../ 表示项目根目录。
                registry.addResourceHandler("/*.html")
                        .addResourceLocations("file:../", "file:./");
                registry.addResourceHandler("/css/**")
                        .addResourceLocations("file:../css/", "file:./css/");
                registry.addResourceHandler("/js/**")
                        .addResourceLocations("file:../js/", "file:./js/");
                registry.addResourceHandler("/images/**")
                        .addResourceLocations("file:../images/", "file:./images/");
                registry.addResourceHandler("/admin/**")
                        .addResourceLocations("file:../admin/", "file:./admin/");
            }
        };
    }
}
