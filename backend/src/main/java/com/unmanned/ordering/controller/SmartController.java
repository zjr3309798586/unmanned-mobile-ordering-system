package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.CouponSuggestion;
import com.unmanned.ordering.model.ProductRecommendation;
import com.unmanned.ordering.model.SupportAutoReply;
import com.unmanned.ordering.model.User;
import com.unmanned.ordering.request.SupportAutoReplyRequest;
import com.unmanned.ordering.service.OrderingService;
import com.unmanned.ordering.service.UserAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/smart")
public class SmartController {
    private final OrderingService orderingService;
    private final UserAuthService userAuthService;

    public SmartController(OrderingService orderingService, UserAuthService userAuthService) {
        this.orderingService = orderingService;
        this.userAuthService = userAuthService;
    }

    @GetMapping("/recommendations")
    public ApiResponse<List<ProductRecommendation>> listRecommendations(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @RequestParam(value = "limit", defaultValue = "6") int limit) {
        String userId = null;
        if (token != null && !token.trim().isEmpty()) {
            try {
                User user = userAuthService.requireUser(token);
                userId = user.getId();
            } catch (RuntimeException ignored) {
                userId = null;
            }
        }
        return ApiResponse.ok(orderingService.listSmartRecommendations(userId, limit));
    }

    @GetMapping("/coupons")
    public ApiResponse<List<CouponSuggestion>> suggestCoupons(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @RequestParam(value = "amount", defaultValue = "0") BigDecimal amount) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.suggestCoupons(user.getId(), amount));
    }

    @PostMapping("/support-reply")
    public ApiResponse<SupportAutoReply> autoReply(@Valid @RequestBody SupportAutoReplyRequest request) {
        return ApiResponse.ok(orderingService.autoReplySupport(request.getContent(), request.getType()));
    }
}
