package com.unmanned.ordering;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.unmanned.ordering.mapper")
public class UnmannedOrderingApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnmannedOrderingApplication.class, args);
    }
}
