package com.unmanned.ordering;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderingApiSmokeTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void supportsCoreOrderingFlow() throws Exception {
        ResponseEntity<String> health = restTemplate.getForEntity("/api/health", String.class);
        assertThat(health.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(health.getBody()).contains("UP");

        ResponseEntity<String> products = restTemplate.getForEntity("/api/products", String.class);
        assertThat(products.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(products.getBody()).contains("P-1001");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<String> cart = restTemplate.postForEntity(
                "/api/cart/items",
                new HttpEntity<>("{\"productId\":\"P-1001\",\"spec\":\"少冰 / 五分糖\",\"quantity\":2}", headers),
                String.class
        );
        assertThat(cart.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(cart.getBody()).contains("P-1001");
        assertThat(cart.getBody()).contains("quantity");

        ResponseEntity<String> order = restTemplate.postForEntity(
                "/api/orders",
                new HttpEntity<>("{\"pickupType\":\"SELF_PICKUP\",\"couponId\":\"C-001\",\"tableNo\":\"A12\"}", headers),
                String.class
        );
        assertThat(order.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(order.getBody()).contains("WAITING_PICKUP");

        ResponseEntity<String> blockedAdmin = restTemplate.getForEntity("/api/admin/dashboard", String.class);
        assertThat(blockedAdmin.getStatusCode().value()).isEqualTo(401);

        ResponseEntity<String> login = restTemplate.postForEntity(
                "/api/admin/login",
                new HttpEntity<>("{\"username\":\"admin\",\"password\":\"admin123\"}", headers),
                String.class
        );
        assertThat(login.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode loginJson = objectMapper.readTree(login.getBody());
        String token = loginJson.path("data").path("token").asText();
        assertThat(token).isNotBlank();

        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.setContentType(MediaType.APPLICATION_JSON);
        adminHeaders.set("X-Admin-Token", token);

        ResponseEntity<String> adminDashboard = restTemplate.exchange(
                "/api/admin/dashboard",
                HttpMethod.GET,
                new HttpEntity<>(adminHeaders),
                String.class
        );
        assertThat(adminDashboard.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(adminDashboard.getBody()).contains("productCount");

        ResponseEntity<String> category = restTemplate.exchange(
                "/api/admin/categories",
                HttpMethod.POST,
                new HttpEntity<>("{\"name\":\"Test Category\",\"sort\":9}", adminHeaders),
                String.class
        );
        assertThat(category.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(category.getBody()).contains("\"code\":201");

        ResponseEntity<String> coupon = restTemplate.exchange(
                "/api/admin/coupons",
                HttpMethod.POST,
                new HttpEntity<>("{\"title\":\"Test Coupon\",\"conditionText\":\"Over 20\",\"discountAmount\":2.00,\"validUntil\":\"2026-12-31\",\"available\":true}", adminHeaders),
                String.class
        );
        assertThat(coupon.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(coupon.getBody()).contains("\"code\":201");
    }
}
