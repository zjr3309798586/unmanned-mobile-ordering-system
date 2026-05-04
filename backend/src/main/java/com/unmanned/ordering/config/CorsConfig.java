package com.unmanned.ordering.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

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
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }

            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(adminAuthInterceptor)
                        .addPathPatterns("/api/admin/**")
                        .excludePathPatterns("/api/admin/login");
            }

            @Override
            public void addViewControllers(ViewControllerRegistry registry) {
                registry.addViewController("/").setViewName("forward:/index.html");
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
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
