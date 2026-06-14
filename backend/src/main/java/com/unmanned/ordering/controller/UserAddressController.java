package com.unmanned.ordering.controller;

import com.unmanned.ordering.common.ApiResponse;
import com.unmanned.ordering.model.User;
import com.unmanned.ordering.model.UserAddress;
import com.unmanned.ordering.request.UserAddressRequest;
import com.unmanned.ordering.service.UserAddressService;
import com.unmanned.ordering.service.UserAuthService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user/addresses")
public class UserAddressController {
    private final UserAuthService userAuthService;
    private final UserAddressService userAddressService;

    public UserAddressController(UserAuthService userAuthService, UserAddressService userAddressService) {
        this.userAuthService = userAuthService;
        this.userAddressService = userAddressService;
    }

    @GetMapping
    public ApiResponse<List<UserAddress>> list(
            @RequestHeader(value = "X-User-Token", required = false) String token) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(userAddressService.list(user.getId()));
    }

    @PostMapping
    public ApiResponse<UserAddress> create(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @RequestBody UserAddressRequest request) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(userAddressService.create(user.getId(), request));
    }

    @PutMapping("/{addressId}")
    public ApiResponse<UserAddress> update(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String addressId,
            @RequestBody UserAddressRequest request) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(userAddressService.update(user.getId(), addressId, request));
    }

    @PatchMapping("/{addressId}/default")
    public ApiResponse<UserAddress> setDefault(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String addressId) {
        User user = userAuthService.requireUser(token);
        return ApiResponse.ok(userAddressService.setDefault(user.getId(), addressId));
    }

    @DeleteMapping("/{addressId}")
    public ApiResponse<Void> delete(
            @RequestHeader(value = "X-User-Token", required = false) String token,
            @PathVariable String addressId) {
        User user = userAuthService.requireUser(token);
        userAddressService.delete(user.getId(), addressId);
        return ApiResponse.ok(null);
    }
}
