package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.SupportTicket;
import com.unmanned.ordering.model.User;
import com.unmanned.ordering.request.CreateSupportTicketRequest;
import com.unmanned.ordering.service.OrderingService;
import com.unmanned.ordering.service.UserAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

/**
 * 前台客服留言接口,H5 和微信小程序共用。
 */
@RestController
@RequestMapping("/api/support-tickets")
public class SupportController {
    private final OrderingService orderingService;
    private final UserAuthService userAuthService;

    public SupportController(OrderingService orderingService, UserAuthService userAuthService) {
        this.orderingService = orderingService;
        this.userAuthService = userAuthService;
    }

    @GetMapping
    public ApiResponse<List<SupportTicket>> listSupportTickets(
            @RequestHeader(value = "X-User-Token", required = false) String token) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(orderingService.listSupportTickets(user.getId()));
    }

    @PostMapping
    public ApiResponse<SupportTicket> createSupportTicket(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @Valid @RequestBody CreateSupportTicketRequest request) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.created(orderingService.createSupportTicket(user.getId(), request));
    }
}
