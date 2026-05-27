package com.unmanned.ordering.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Spring MVC 全局配置(跨域 / 拦截器 / 视图 / 静态资源)。
 *
 * 这个类返回一个 WebMvcConfigurer Bean,覆盖 4 个钩子:
 *
 *   1. addCorsMappings        允许任意来源访问 /api/** 接口
 *   2. addInterceptors        把 AdminAuthInterceptor 挂到 /api/admin/**
 *   3. addViewControllers     根路径 / → forward 到 /index.html
 *   4. addResourceHandlers    H5 / Admin / css / js / images 物理路径映射
 *
 * 注意:addResourceHandlers 与 FrontendResourceConfig 在功能上有重叠,
 * Spring 会按注册顺序匹配,本类的注册先生效。改静态资源路径要两处同步改。
 */
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
                // 允许前台 H5、小程序调试工具任意来源访问 /api/**。
                // 生产环境应该把 allowedOrigins 收窄到实际域名,避免接口被滥用。
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }

            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                // 后台管理接口统一拦截校验 X-Admin-Token,登录接口本身排除。
                registry.addInterceptor(adminAuthInterceptor)
                        .addPathPatterns("/api/admin/**")
                        .excludePathPatterns("/api/admin/login");
            }

            @Override
            public void addViewControllers(ViewControllerRegistry registry) {
                // 访问 http://127.0.0.1:8080/ 时直接转发到首页。
                registry.addViewController("/").setViewName("forward:/index.html");
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // 把 URL 路径映射到磁盘上的物理位置。
                // Spring Boot 从 backend 目录启动,所以 file:../ 表示项目根目录。
                // H5 已整理到 h5/ 子目录,admin 保持在项目根目录下。
                //
                // 各 file:../ 与 file:./ 都列出来是为了兼容两种启动方式:
                //   从 backend 目录启动 → file:../ 生效
                //   从项目根目录启动   → file:./ 生效
                registry.addResourceHandler("/*.html")
                        .addResourceLocations("file:../h5/pages/", "file:./h5/pages/");
                registry.addResourceHandler("/css/**")
                        .addResourceLocations("file:../h5/css/", "file:./h5/css/");
                registry.addResourceHandler("/js/**")
                        .addResourceLocations("file:../h5/js/", "file:./h5/js/");
                registry.addResourceHandler("/images/**")
                        .addResourceLocations("file:../h5/images/", "file:./h5/images/");
                registry.addResourceHandler("/admin/**")
                        .addResourceLocations("file:../admin/", "file:./admin/");
            }
        };
    }
}
