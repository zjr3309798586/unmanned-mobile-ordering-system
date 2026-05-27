package com.unmanned.ordering;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot 应用入口。
 *
 * 启动方式:
 *   1. IDE 里直接运行 main 方法
 *   2. 命令行 cd backend && mvn spring-boot:run
 *   3. 打包后 java -jar target/xxx.jar
 *
 * 启动后:
 *   - Tomcat 监听 8080 端口
 *   - 自动扫描所有 @Component / @Service / @Controller / @Configuration 类
 *   - @MapperScan 把 mapper 包下的接口注册为 MyBatis Mapper Bean
 *   - HikariCP 连接池连接 MySQL,执行 schema-mysql.sql + data-mysql.sql 初始化建表
 *   - 前台首页地址:http://127.0.0.1:8080/
 *   - 后台登录地址:http://127.0.0.1:8080/admin/login.html
 *   - 健康检查:GET /api/health
 */
@SpringBootApplication
@MapperScan("com.unmanned.ordering.mapper")
public class UnmannedOrderingApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnmannedOrderingApplication.class, args);
    }
}
