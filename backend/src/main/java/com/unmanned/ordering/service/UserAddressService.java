package com.unmanned.ordering.service;

import com.unmanned.ordering.exception.BusinessException;
import com.unmanned.ordering.mapper.UserAddressMapper;
import com.unmanned.ordering.model.UserAddress;
import com.unmanned.ordering.request.UserAddressRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class UserAddressService {
    private final UserAddressMapper userAddressMapper;

    public UserAddressService(UserAddressMapper userAddressMapper) {
        this.userAddressMapper = userAddressMapper;
    }

    public List<UserAddress> list(String userId) {
        return userAddressMapper.listByUserId(userId);
    }

    @Transactional
    public UserAddress create(String userId, UserAddressRequest request) {
        UserAddress address = buildAddress(new UserAddress(), userId, request);
        address.setId("ADDR-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        address.setCreatedAt(LocalDateTime.now());
        address.setUpdatedAt(address.getCreatedAt());
        boolean firstAddress = userAddressMapper.countByUserId(userId) == 0;
        address.setDefaultAddress(firstAddress || Boolean.TRUE.equals(request.getDefaultAddress()));
        if (address.isDefaultAddress()) {
            userAddressMapper.clearDefault(userId);
        }
        userAddressMapper.insert(address);
        return userAddressMapper.findByIdAndUserId(address.getId(), userId);
    }

    @Transactional
    public UserAddress update(String userId, String addressId, UserAddressRequest request) {
        UserAddress existing = requireAddress(userId, addressId);
        boolean oldDefault = existing.isDefaultAddress();
        UserAddress address = buildAddress(existing, userId, request);
        address.setId(addressId);
        address.setUpdatedAt(LocalDateTime.now());
        if (Boolean.TRUE.equals(request.getDefaultAddress())) {
            userAddressMapper.clearDefault(userId);
            address.setDefaultAddress(true);
        } else if (oldDefault) {
            address.setDefaultAddress(true);
        }
        userAddressMapper.update(address);
        return userAddressMapper.findByIdAndUserId(addressId, userId);
    }

    @Transactional
    public void delete(String userId, String addressId) {
        UserAddress existing = requireAddress(userId, addressId);
        userAddressMapper.delete(addressId, userId);
        if (existing.isDefaultAddress() && userAddressMapper.countByUserId(userId) > 0) {
            userAddressMapper.promoteLatestAsDefault(userId);
        }
    }

    @Transactional
    public UserAddress setDefault(String userId, String addressId) {
        requireAddress(userId, addressId);
        userAddressMapper.clearDefault(userId);
        userAddressMapper.setDefault(addressId, userId);
        return userAddressMapper.findByIdAndUserId(addressId, userId);
    }

    private UserAddress requireAddress(String userId, String addressId) {
        UserAddress address = userAddressMapper.findByIdAndUserId(addressId, userId);
        if (address == null) {
            throw new BusinessException(404, "地址不存在");
        }
        return address;
    }

    private UserAddress buildAddress(UserAddress address, String userId, UserAddressRequest request) {
        if (request == null) {
            throw new BusinessException(400, "请填写地址信息");
        }
        String receiverName = clean(request.getReceiverName());
        String phone = clean(request.getPhone());
        String addressDetail = clean(request.getAddressDetail());
        if (!StringUtils.hasText(receiverName)) {
            throw new BusinessException(400, "请填写收货人");
        }
        if (!StringUtils.hasText(phone)) {
            throw new BusinessException(400, "请填写联系电话");
        }
        if (!StringUtils.hasText(addressDetail)) {
            throw new BusinessException(400, "请填写详细地址");
        }
        address.setUserId(userId);
        address.setReceiverName(receiverName);
        address.setPhone(phone);
        address.setAddressDetail(addressDetail);
        address.setDefaultAddress(Boolean.TRUE.equals(request.getDefaultAddress()));
        return address;
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
