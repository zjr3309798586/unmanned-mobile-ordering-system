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

/**
 * 前台用户登录服务。
 *
 * 提供两种登录方式:
 *   1. devLogin: H5 游客登录,直接给一个游客 token,不验证微信身份。
 *   2. wechatLogin: 正式微信小程序登录,通过 wx.login() 拿 code,
 *      后端拿 code + appid + secret 调微信接口换 openid,以此识别用户。
 *
 * Token 机制:
 *   - 登录成功后给前端一个 token 字符串
 *   - 前端把 token 放到请求头 X-User-Token
 *   - 需要登录的接口在 Controller 里调 requireUser(token) 反查用户
 *   - 退出登录时把数据库里的 token 清掉,前端那个 token 就失效了
 */
@Service
public class UserAuthService {
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;     // Spring 提供的 JSON 解析器
    private final RestTemplate restTemplate = new RestTemplate();  // 调用微信接口的 HTTP 客户端

    // 微信小程序 AppID,从 application.yml 或环境变量 WECHAT_APP_ID 注入
    @Value("${wechat.app-id:}")
    private String wechatAppId;

    // 微信小程序 AppSecret,从 application.yml 或环境变量 WECHAT_APP_SECRET 注入
    @Value("${wechat.app-secret:}")
    private String wechatAppSecret;

    public UserAuthService(UserMapper userMapper, ObjectMapper objectMapper) {
        this.userMapper = userMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * H5 浏览器使用的"游客登录"。
     *
     * 不校验身份,直接创建临时用户 + 默认会员资料并返回 token。
     * 微信小程序正式登录仍使用 wechatLogin。
     */
    @Transactional
    public UserSession devLogin(DevLoginRequest request) {
        String nickname = defaultNickname(request == null ? null : request.getNickname());
        String token = newToken();
        // openid 用 null 占位,表示这不是微信用户
        User user = new User(newUserId(), null, nickname, "", token, LocalDateTime.now(), LocalDateTime.now());
        userMapper.insertUser(user);
        userMapper.insertDefaultProfile(user.getId(), nickname);  // 同时建一份会员资料
        return toSession(user, "GUEST");
    }

    /**
     * 正式微信小程序登录。
     *
     * 流程:
     *   1. 小程序前端调用 wx.login() 拿到一次性 code
     *   2. 前端把 code 通过此接口传给后端
     *   3. 后端用 code + AppID + AppSecret 调微信 jscode2session 接口
     *   4. 微信返回 openid(唯一标识) + session_key
     *   5. 后端按 openid 查用户:已存在 → 更新 token / 不存在 → 新建用户
     *
     * @throws BusinessException 400 配置缺失 / 微信接口返回错误
     * @throws BusinessException 502 微信接口网络故障
     */
    @Transactional
    public UserSession wechatLogin(WechatLoginRequest request) {
        // 启动前必须配置好 WECHAT_APP_ID / WECHAT_APP_SECRET 环境变量
        if (!StringUtils.hasText(wechatAppId) || !StringUtils.hasText(wechatAppSecret)) {
            throw new BusinessException(400, "微信登录未配置,请先设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET");
        }

        // 拼装微信官方接口 URL
        String url = UriComponentsBuilder.fromHttpUrl("https://api.weixin.qq.com/sns/jscode2session")
                .queryParam("appid", wechatAppId)
                .queryParam("secret", wechatAppSecret)
                .queryParam("js_code", request.getCode())
                .queryParam("grant_type", "authorization_code")
                .toUriString();

        // 调用微信接口并解析 JSON 返回
        JsonNode response;
        try {
            response = objectMapper.readTree(restTemplate.getForObject(url, String.class));
        } catch (Exception error) {
            throw new BusinessException(502, "微信登录服务调用失败");
        }

        // 微信返回 errcode != 0 说明 code 无效或被微信拒绝
        if (response.has("errcode") && response.path("errcode").asInt() != 0) {
            throw new BusinessException(400, "微信登录失败:" + response.path("errmsg").asText("code 无效"));
        }

        // openid 是用户的唯一身份标识
        String openid = response.path("openid").asText("");
        if (!StringUtils.hasText(openid)) {
            throw new BusinessException(400, "微信登录失败:未获取到 openid");
        }

        // 处理用户记录:已存在就更新昵称/头像/token,不存在就新建
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

    /**
     * 校验请求是否有合法 token,有则返回当前用户。
     *
     * 所有需要登录的接口(购物车 / 订单 / 我的)都会在 Controller 里调这个方法。
     * token 来自请求头 X-User-Token。
     *
     * @throws BusinessException 401 token 缺失 / 已失效
     */
    public User requireUser(String token) {
        if (!StringUtils.hasText(token)) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.findByToken(token);
        if (user == null) {
            throw new BusinessException(401, "登录已失效,请重新登录");
        }
        return user;
    }

    /** "我的"页使用:按 token 查询当前用户资料(含节省金额、会员等级)。 */
    public UserProfile getProfile(String token) {
        User user = requireUser(token);
        UserProfile profile = userMapper.findProfileByUserId(user.getId());
        if (profile == null) {
            throw new BusinessException(404, "用户资料不存在");
        }
        return profile;
    }

    /**
     * 退出登录:清空数据库里这条 token。
     * 之后前端这个 token 再来请求,requireUser 会判定为已失效。
     */
    public void logout(String token) {
        if (StringUtils.hasText(token)) {
            userMapper.clearToken(token);
        }
    }

    /** 把 User + 登录类型组装成给前端的 UserSession 对象。 */
    private UserSession toSession(User user, String loginType) {
        return new UserSession(user.getId(), user.getNickname(), user.getAvatarUrl(), user.getToken(), loginType);
    }

    /** 昵称字段:有内容就 trim,没有就用"微信用户"兜底。 */
    private String defaultNickname(String nickname) {
        return StringUtils.hasText(nickname) ? nickname.trim() : "微信用户";
    }

    /** 用户 ID 格式:USER-时间戳-6 位 UUID。 */
    private String newUserId() {
        return "USER-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
    }

    /** Token 格式:U- + 32 位无横线大写 UUID。每次登录都生成新 token。 */
    private String newToken() {
        return "U-" + UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT);
    }
}
