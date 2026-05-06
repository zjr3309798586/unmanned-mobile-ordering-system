package com.unmanned.ordering.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unmanned.ordering.exception.BusinessException;
import com.unmanned.ordering.mapper.UserMapper;
import com.unmanned.ordering.model.User;
import com.unmanned.ordering.model.UserProfile;
import com.unmanned.ordering.model.UserSession;
import com.unmanned.ordering.request.DevLoginRequest;
import com.unmanned.ordering.request.WechatLoginRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

@Service
public class UserAuthService {
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${wechat.app-id:}")
    private String wechatAppId;

    @Value("${wechat.app-secret:}")
    private String wechatAppSecret;

    public UserAuthService(UserMapper userMapper, ObjectMapper objectMapper) {
        this.userMapper = userMapper;
        this.objectMapper = objectMapper;
    }

    // H5 浏览器开发阶段使用的游客登录。
    // 它会创建一个临时用户，生成 token，并创建默认会员资料。
    @Transactional
    public UserSession devLogin(DevLoginRequest request) {
        String nickname = defaultNickname(request == null ? null : request.getNickname());
        String token = newToken();
        User user = new User(newUserId(), null, nickname, "", token, LocalDateTime.now(), LocalDateTime.now());
        userMapper.insertUser(user);
        userMapper.insertDefaultProfile(user.getId(), nickname);
        return toSession(user, "GUEST");
    }

    // 正式微信小程序登录。
    // 小程序前端先 wx.login() 获取 code，再把 code 传给这个接口。
    // 后端调用微信 jscode2session 接口，换取 openid。
    @Transactional
    public UserSession wechatLogin(WechatLoginRequest request) {
        if (!StringUtils.hasText(wechatAppId) || !StringUtils.hasText(wechatAppSecret)) {
            throw new BusinessException(400, "微信登录未配置，请先设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET");
        }

        String url = UriComponentsBuilder.fromHttpUrl("https://api.weixin.qq.com/sns/jscode2session")
                .queryParam("appid", wechatAppId)
                .queryParam("secret", wechatAppSecret)
                .queryParam("js_code", request.getCode())
                .queryParam("grant_type", "authorization_code")
                .toUriString();

        JsonNode response;
        try {
            response = objectMapper.readTree(restTemplate.getForObject(url, String.class));
        } catch (Exception error) {
            throw new BusinessException(502, "微信登录服务调用失败");
        }

        if (response.has("errcode") && response.path("errcode").asInt() != 0) {
            throw new BusinessException(400, "微信登录失败：" + response.path("errmsg").asText("code 无效"));
        }

        String openid = response.path("openid").asText("");
        if (!StringUtils.hasText(openid)) {
            throw new BusinessException(400, "微信登录失败：未获取到 openid");
        }

        String nickname = defaultNickname(request.getNickname());
        String avatarUrl = request.getAvatarUrl() == null ? "" : request.getAvatarUrl().trim();
        String token = newToken();
        User user = userMapper.findByOpenid(openid);
        if (user == null) {
            user = new User(newUserId(), openid, nickname, avatarUrl, token, LocalDateTime.now(), LocalDateTime.now());
            userMapper.insertUser(user);
            userMapper.insertDefaultProfile(user.getId(), nickname);
        } else {
            user.setNickname(nickname);
            user.setAvatarUrl(avatarUrl);
            user.setToken(token);
            userMapper.updateUserSession(user);
            userMapper.updateProfileNickname(user.getId(), nickname);
        }
        return toSession(user, "WECHAT");
    }

    // 需要登录的接口都会调用这个方法。
    // token 来自请求头 X-User-Token。
    // 如果 token 不存在或失效，就抛出 401 错误。
    public User requireUser(String token) {
        if (!StringUtils.hasText(token)) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.findByToken(token);
        if (user == null) {
            throw new BusinessException(401, "登录已失效，请重新登录");
        }
        return user;
    }

    // 我的页使用，根据 token 查询当前用户资料。
    public UserProfile getProfile(String token) {
        User user = requireUser(token);
        UserProfile profile = userMapper.findProfileByUserId(user.getId());
        if (profile == null) {
            throw new BusinessException(404, "用户资料不存在");
        }
        return profile;
    }

    // 退出登录时清空数据库中的 token。
    public void logout(String token) {
        if (StringUtils.hasText(token)) {
            userMapper.clearToken(token);
        }
    }

    private UserSession toSession(User user, String loginType) {
        return new UserSession(user.getId(), user.getNickname(), user.getAvatarUrl(), user.getToken(), loginType);
    }

    private String defaultNickname(String nickname) {
        return StringUtils.hasText(nickname) ? nickname.trim() : "微信用户";
    }

    private String newUserId() {
        return "USER-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
    }

    private String newToken() {
        return "U-" + UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT);
    }
}
