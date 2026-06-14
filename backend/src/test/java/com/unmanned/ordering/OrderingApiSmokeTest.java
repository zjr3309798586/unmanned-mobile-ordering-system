package com.unmanned.ordering;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderingApiSmokeTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void configurePatchSupport() {
        restTemplate.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
    }

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

        ResponseEntity<String> blockedCart = restTemplate.getForEntity("/api/cart", String.class);
        assertThat(blockedCart.getStatusCode().value()).isEqualTo(401);

        ResponseEntity<String> userLogin = restTemplate.postForEntity(
                "/api/auth/dev-login",
                new HttpEntity<>("{\"nickname\":\"Test User\"}", headers),
                String.class
        );
        assertThat(userLogin.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode userLoginJson = objectMapper.readTree(userLogin.getBody());
        String userToken = userLoginJson.path("data").path("token").asText();
        assertThat(userToken).isNotBlank();

        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.setContentType(MediaType.APPLICATION_JSON);
        userHeaders.set("X-User-Token", userToken);

        ResponseEntity<String> emptyFavorites = restTemplate.exchange(
                "/api/favorites",
                HttpMethod.GET,
                new HttpEntity<>(userHeaders),
                String.class
        );
        assertThat(emptyFavorites.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<String> favoriteAdded = restTemplate.exchange(
                "/api/favorites/P-1001",
                HttpMethod.POST,
                new HttpEntity<>("{}", userHeaders),
                String.class
        );
        assertThat(favoriteAdded.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(favoriteAdded.getBody()).contains("P-1001");

        ResponseEntity<String> favoriteStatus = restTemplate.exchange(
                "/api/favorites/P-1001/status",
                HttpMethod.GET,
                new HttpEntity<>(userHeaders),
                String.class
        );
        assertThat(favoriteStatus.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(favoriteStatus.getBody()).contains("\"favorite\":true");

        ResponseEntity<String> favoriteDeleted = restTemplate.exchange(
                "/api/favorites/P-1001",
                HttpMethod.DELETE,
                new HttpEntity<>(userHeaders),
                String.class
        );
        assertThat(favoriteDeleted.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<String> cart = restTemplate.postForEntity(
                "/api/cart/items",
                new HttpEntity<>("{\"productId\":\"P-1001\",\"spec\":\"少冰 / 五分糖\",\"quantity\":2}", userHeaders),
                String.class
        );
        assertThat(cart.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(cart.getBody()).contains("P-1001");
        assertThat(cart.getBody()).contains("quantity");

        ResponseEntity<String> blockedClaim = restTemplate.exchange(
                "/api/user/coupons/C-001/claim",
                HttpMethod.POST,
                new HttpEntity<>("{}", userHeaders),
                String.class
        );
        assertThat(blockedClaim.getStatusCode().value()).isEqualTo(400);
        assertThat(blockedClaim.getBody()).contains("请先开通省钱卡");

        ResponseEntity<String> savingCard = restTemplate.exchange(
                "/api/saving-card/open",
                HttpMethod.POST,
                new HttpEntity<>("{}", userHeaders),
                String.class
        );
        assertThat(savingCard.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(savingCard.getBody()).contains("省钱卡会员");

        ResponseEntity<String> claimedCoupon = restTemplate.exchange(
                "/api/user/coupons/C-001/claim",
                HttpMethod.POST,
                new HttpEntity<>("{}", userHeaders),
                String.class
        );
        assertThat(claimedCoupon.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(claimedCoupon.getBody()).contains("AVAILABLE");

        ResponseEntity<String> lowAmountLogin = restTemplate.postForEntity(
                "/api/auth/dev-login",
                new HttpEntity<>("{\"nickname\":\"Low Amount User\"}", headers),
                String.class
        );
        assertThat(lowAmountLogin.getStatusCode().is2xxSuccessful()).isTrue();
        String lowAmountToken = objectMapper.readTree(lowAmountLogin.getBody()).path("data").path("token").asText();
        HttpHeaders lowAmountHeaders = new HttpHeaders();
        lowAmountHeaders.setContentType(MediaType.APPLICATION_JSON);
        lowAmountHeaders.set("X-User-Token", lowAmountToken);

        ResponseEntity<String> lowAmountCart = restTemplate.postForEntity(
                "/api/cart/items",
                new HttpEntity<>("{\"productId\":\"P-1001\",\"spec\":\"standard\",\"quantity\":1}", lowAmountHeaders),
                String.class
        );
        assertThat(lowAmountCart.getStatusCode().is2xxSuccessful()).isTrue();
        restTemplate.exchange(
                "/api/saving-card/open",
                HttpMethod.POST,
                new HttpEntity<>("{}", lowAmountHeaders),
                String.class
        );
        ResponseEntity<String> lowAmountClaim = restTemplate.exchange(
                "/api/user/coupons/C-001/claim",
                HttpMethod.POST,
                new HttpEntity<>("{}", lowAmountHeaders),
                String.class
        );
        assertThat(lowAmountClaim.getStatusCode().is2xxSuccessful()).isTrue();
        ResponseEntity<String> lowAmountOrder = restTemplate.postForEntity(
                "/api/orders",
                new HttpEntity<>("{\"pickupType\":\"SELF_PICKUP\",\"couponId\":\"C-001\",\"tableNo\":\"B01\"}", lowAmountHeaders),
                String.class
        );
        assertThat(lowAmountOrder.getStatusCode().value()).isEqualTo(400);

        ResponseEntity<String> userCoupons = restTemplate.exchange(
                "/api/user/coupons",
                HttpMethod.GET,
                new HttpEntity<>(userHeaders),
                String.class
        );
        assertThat(userCoupons.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(userCoupons.getBody()).contains("C-001");

        ResponseEntity<String> order = restTemplate.postForEntity(
                "/api/orders",
                new HttpEntity<>("{\"pickupType\":\"SELF_PICKUP\",\"couponId\":\"C-001\",\"tableNo\":\"A12\"}", userHeaders),
                String.class
        );
        assertThat(order.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(order.getBody()).contains("MAKING");
        JsonNode orderJson = objectMapper.readTree(order.getBody());
        String orderId = orderJson.path("data").path("id").asText();
        assertThat(orderId).isNotBlank();

        ResponseEntity<String> supportTicket = restTemplate.postForEntity(
                "/api/support-tickets",
                new HttpEntity<>("{\"type\":\"ORDER_ISSUE\",\"orderId\":\"" + orderId + "\",\"content\":\"Pickup time question\",\"contact\":\"13800000000\"}", userHeaders),
                String.class
        );
        assertThat(supportTicket.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(supportTicket.getBody()).contains("PENDING");
        JsonNode supportTicketJson = objectMapper.readTree(supportTicket.getBody());
        String ticketId = supportTicketJson.path("data").path("id").asText();
        assertThat(ticketId).isNotBlank();

        ResponseEntity<String> userSupportTickets = restTemplate.exchange(
                "/api/support-tickets",
                HttpMethod.GET,
                new HttpEntity<>(userHeaders),
                String.class
        );
        assertThat(userSupportTickets.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(userSupportTickets.getBody()).contains(ticketId);

        ResponseEntity<String> mine = restTemplate.exchange(
                "/api/mine",
                HttpMethod.GET,
                new HttpEntity<>(userHeaders),
                String.class
        );
        assertThat(mine.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(mine.getBody()).contains("Test User");
        assertThat(mine.getBody()).doesNotContain("points");

        ResponseEntity<String> addressCreated = restTemplate.postForEntity(
                "/api/user/addresses",
                new HttpEntity<>("{\"receiverName\":\"Test User\",\"phone\":\"13800001111\",\"addressDetail\":\"3号宿舍楼 502\",\"defaultAddress\":true}", userHeaders),
                String.class
        );
        assertThat(addressCreated.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(addressCreated.getBody()).contains("3号宿舍楼 502");
        String addressId = objectMapper.readTree(addressCreated.getBody()).path("data").path("id").asText();
        assertThat(addressId).isNotBlank();

        ResponseEntity<String> addressList = restTemplate.exchange(
                "/api/user/addresses",
                HttpMethod.GET,
                new HttpEntity<>(userHeaders),
                String.class
        );
        assertThat(addressList.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(addressList.getBody()).contains(addressId);

        ResponseEntity<String> addressDefault = restTemplate.exchange(
                "/api/user/addresses/" + addressId + "/default",
                HttpMethod.PATCH,
                new HttpEntity<>("{}", userHeaders),
                String.class
        );
        assertThat(addressDefault.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(addressDefault.getBody()).contains("\"defaultAddress\":true");

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

        ResponseEntity<String> adminOrders = restTemplate.exchange(
                "/api/admin/orders",
                HttpMethod.GET,
                new HttpEntity<>(adminHeaders),
                String.class
        );
        assertThat(adminOrders.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(adminOrders.getBody()).contains("MAKING");

        ResponseEntity<String> readyOrder = restTemplate.exchange(
                "/api/admin/orders/" + orderId + "/ready",
                HttpMethod.PATCH,
                new HttpEntity<>("{}", adminHeaders),
                String.class
        );
        assertThat(readyOrder.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(readyOrder.getBody()).contains("WAITING_PICKUP");

        ResponseEntity<String> deliveryCart = restTemplate.postForEntity(
                "/api/cart/items",
                new HttpEntity<>("{\"productId\":\"P-1001\",\"spec\":\"standard\",\"quantity\":1}", userHeaders),
                String.class
        );
        assertThat(deliveryCart.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<String> deliveryOrder = restTemplate.postForEntity(
                "/api/orders",
                new HttpEntity<>("{\"pickupType\":\"DELIVERY\",\"deliveryAddress\":\"3号宿舍楼502\",\"deliveryContact\":\"13800000000\"}", userHeaders),
                String.class
        );
        assertThat(deliveryOrder.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(deliveryOrder.getBody()).contains("DELIVERY");
        assertThat(deliveryOrder.getBody()).contains("3号宿舍楼502");
        assertThat(deliveryOrder.getBody()).contains("deliveryFee");
        JsonNode deliveryOrderJson = objectMapper.readTree(deliveryOrder.getBody());
        String deliveryOrderId = deliveryOrderJson.path("data").path("id").asText();
        assertThat(deliveryOrderId).isNotBlank();

        ResponseEntity<String> deliveringOrder = restTemplate.exchange(
                "/api/admin/orders/" + deliveryOrderId + "/ready",
                HttpMethod.PATCH,
                new HttpEntity<>("{}", adminHeaders),
                String.class
        );
        assertThat(deliveringOrder.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(deliveringOrder.getBody()).contains("DELIVERING");

        ResponseEntity<String> adminSupportTickets = restTemplate.exchange(
                "/api/admin/support-tickets",
                HttpMethod.GET,
                new HttpEntity<>(adminHeaders),
                String.class
        );
        assertThat(adminSupportTickets.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(adminSupportTickets.getBody()).contains(ticketId);

        ResponseEntity<String> repliedSupportTicket = restTemplate.exchange(
                "/api/admin/support-tickets/" + ticketId + "/reply",
                HttpMethod.PATCH,
                new HttpEntity<>("{\"replyContent\":\"Please check pickup number at the counter.\"}", adminHeaders),
                String.class
        );
        assertThat(repliedSupportTicket.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(repliedSupportTicket.getBody()).contains("REPLIED");

        ResponseEntity<String> userSupportTicketsAfterReply = restTemplate.exchange(
                "/api/support-tickets",
                HttpMethod.GET,
                new HttpEntity<>(userHeaders),
                String.class
        );
        assertThat(userSupportTicketsAfterReply.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(userSupportTicketsAfterReply.getBody()).contains("Please check pickup number");

        ResponseEntity<String> closedSupportTicket = restTemplate.exchange(
                "/api/admin/support-tickets/" + ticketId + "/close",
                HttpMethod.PATCH,
                new HttpEntity<>("{}", adminHeaders),
                String.class
        );
        assertThat(closedSupportTicket.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(closedSupportTicket.getBody()).contains("CLOSED");

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
                new HttpEntity<>("{\"title\":\"Test Coupon\",\"conditionText\":\"Over 20\",\"minAmount\":20.00,\"discountAmount\":2.00,\"validUntil\":\"2026-12-31\",\"available\":true}", adminHeaders),
                String.class
        );
        assertThat(coupon.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(coupon.getBody()).contains("\"code\":201");

        ResponseEntity<String> banner = restTemplate.exchange(
                "/api/admin/banners",
                HttpMethod.POST,
                new HttpEntity<>("{\"title\":\"Test Banner\",\"subtitle\":\"Banner subtitle\",\"tagText\":\"New\",\"image\":\"/images/test-banner.svg\",\"linkText\":\"Open\",\"linkUrl\":\"menu.html\",\"sort\":3,\"enabled\":true}", adminHeaders),
                String.class
        );
        assertThat(banner.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(banner.getBody()).contains("\"code\":201");
        assertThat(banner.getBody()).contains("/images/test-banner.svg");
    }
}
