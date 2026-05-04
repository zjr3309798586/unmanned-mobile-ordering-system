package com.unmanned.ordering;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderingApiSmokeTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void supportsCoreOrderingFlow() {
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
                new HttpEntity<>("{\"productId\":\"P-1001\",\"spec\":\"Iced / Regular sugar\",\"quantity\":2}", headers),
                String.class
        );
        assertThat(cart.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(cart.getBody()).contains("Orange Americano");

        ResponseEntity<String> order = restTemplate.postForEntity(
                "/api/orders",
                new HttpEntity<>("{\"pickupType\":\"SELF_PICKUP\",\"couponId\":\"C-001\",\"tableNo\":\"A12\"}", headers),
                String.class
        );
        assertThat(order.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(order.getBody()).contains("WAITING_PICKUP");
    }
}
