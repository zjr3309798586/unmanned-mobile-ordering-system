package com.unmanned.ordering.mapper;

import com.unmanned.ordering.model.User;
import com.unmanned.ordering.model.UserCoupon;
import com.unmanned.ordering.model.UserProfile;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户相关三张表的数据访问层:
 *   users          登录会话(openid / token / 昵称 / 头像)
 *   user_profiles  用户资料(会员等级 / 余额 / 节省金额 / 券数量)
 *   user_coupons   用户优惠券(领取 → 使用 → 取消恢复 的状态机)
 *
 * user_coupons.status 取值:
 *   AVAILABLE  已领取,未使用
 *   USED       已用于某订单
 */
@Mapper
public interface UserMapper {

    // ===== users 登录会话 =====

    /** 按 token 查用户(几乎所有需要登录的接口都会调一次)。 */
    @Select("SELECT * FROM users WHERE token = #{token}")
    User findByToken(String token);

    /** 按 openid 查用户(微信登录时识别老用户用)。 */
    @Select("SELECT * FROM users WHERE openid = #{openid}")
    User findByOpenid(String openid);

    /** 按用户 ID 查用户。 */
    @Select("SELECT * FROM users WHERE id = #{userId}")
    User findById(String userId);

    /** 首次登录时插入新用户。 */
    @Insert({
            "INSERT INTO users (id, openid, nickname, avatar_url, token, created_at, updated_at)",
            "VALUES (#{id}, #{openid}, #{nickname}, #{avatarUrl}, #{token}, #{createdAt}, #{updatedAt})"
    })
    int insertUser(User user);

    /** 老用户重新登录时刷新昵称 / 头像 / token。 */
    @Update({
            "UPDATE users",
            "SET nickname = #{nickname}, avatar_url = #{avatarUrl}, token = #{token}, updated_at = CURRENT_TIMESTAMP",
            "WHERE id = #{id}"
    })
    int updateUserSession(User user);

    /** 退出登录:把 token 清成 NULL,前端那个 token 立即失效。 */
    @Update("UPDATE users SET token = NULL, updated_at = CURRENT_TIMESTAMP WHERE token = #{token}")
    int clearToken(String token);

    // ===== user_profiles 用户资料 =====

    /** "我的"页查询用户资料(等级 / 节省金额 / 券数量)。 */
    @Select("SELECT * FROM user_profiles WHERE user_id = #{userId}")
    UserProfile findProfileByUserId(String userId);

    /** 后台用户管理列表。 */
    @Select("SELECT * FROM user_profiles ORDER BY user_id")
    List<UserProfile> listProfiles();

    /** 首次登录时给用户建一份默认资料(普通会员 / 节省 0)。 */
    @Insert({
            "INSERT INTO user_profiles (user_id, nickname, member_level, balance, coupon_count, saving_amount)",
            "VALUES (#{userId}, #{nickname}, '普通会员', 0.00, 0, 0.00)"
    })
    int insertDefaultProfile(@Param("userId") String userId, @Param("nickname") String nickname);

    /** 登录时同步用户昵称到 user_profiles。 */
    @Update("UPDATE user_profiles SET nickname = #{nickname} WHERE user_id = #{userId}")
    int updateProfileNickname(@Param("userId") String userId, @Param("nickname") String nickname);

    /** 购买省钱卡后升级会员等级(例如"省钱卡会员")。 */
    @Update("UPDATE user_profiles SET member_level = #{memberLevel} WHERE user_id = #{userId}")
    int updateMemberLevel(@Param("userId") String userId, @Param("memberLevel") String memberLevel);

    // ===== user_coupons 用户优惠券 =====

    /**
     * 当前用户的所有优惠券(含已用),按"可用排前 + 领取时间倒序"。
     * JOIN coupons 是为了把券标题 / 满减门槛 / 折扣金额一起拿出来。
     */
    @Select({
            "SELECT uc.id, uc.user_id, uc.coupon_id, c.title, c.condition_text,",
            "       c.min_amount, c.discount_amount, c.valid_until, c.available AS coupon_available,",
            "       uc.status, uc.claimed_at, uc.used_at, uc.order_id",
            "FROM user_coupons uc",
            "JOIN coupons c ON uc.coupon_id = c.id",
            "WHERE uc.user_id = #{userId}",
            "ORDER BY CASE WHEN uc.status = 'AVAILABLE' THEN 0 ELSE 1 END, uc.claimed_at DESC"
    })
    List<UserCoupon> listUserCoupons(String userId);

    /** 按 user + couponId 查单条用户优惠券(领券后返回详情用)。 */
    @Select({
            "SELECT uc.id, uc.user_id, uc.coupon_id, c.title, c.condition_text,",
            "       c.min_amount, c.discount_amount, c.valid_until, c.available AS coupon_available,",
            "       uc.status, uc.claimed_at, uc.used_at, uc.order_id",
            "FROM user_coupons uc",
            "JOIN coupons c ON uc.coupon_id = c.id",
            "WHERE uc.user_id = #{userId} AND uc.coupon_id = #{couponId}"
    })
    UserCoupon findUserCoupon(@Param("userId") String userId, @Param("couponId") String couponId);

    /**
     * 下单前最关键的一次校验:券必须属于当前用户 + 状态为 AVAILABLE。
     * Service.createOrder 调这个方法,如果返回 null 就拒绝订单。
     */
    @Select({
            "SELECT uc.id, uc.user_id, uc.coupon_id, c.title, c.condition_text,",
            "       c.min_amount, c.discount_amount, c.valid_until, c.available AS coupon_available,",
            "       uc.status, uc.claimed_at, uc.used_at, uc.order_id",
            "FROM user_coupons uc",
            "JOIN coupons c ON uc.coupon_id = c.id",
            "WHERE uc.user_id = #{userId} AND uc.coupon_id = #{couponId}",
            "  AND uc.status = 'AVAILABLE'"
    })
    UserCoupon findAvailableUserCoupon(@Param("userId") String userId, @Param("couponId") String couponId);

    /** 判断用户是否已经领过某张券(防重复领)。 */
    @Select("SELECT COUNT(*) FROM user_coupons WHERE user_id = #{userId} AND coupon_id = #{couponId}")
    int countUserCoupon(@Param("userId") String userId, @Param("couponId") String couponId);

    /** 领券:写入一条用户优惠券记录,status=AVAILABLE。 */
    @Insert({
            "INSERT INTO user_coupons (id, user_id, coupon_id, status, claimed_at)",
            "VALUES (#{id}, #{userId}, #{couponId}, #{status}, #{claimedAt})"
    })
    int insertUserCoupon(@Param("id") String id,
                         @Param("userId") String userId,
                         @Param("couponId") String couponId,
                         @Param("status") String status,
                         @Param("claimedAt") LocalDateTime claimedAt);

    /**
     * 下单成功:把用户优惠券标记为 USED,记录使用时间和关联订单 ID。
     * 注意 WHERE 中包含 status='AVAILABLE',如果券已被别处使用,update 影响行数为 0,
     * Service 据此抛"优惠券已使用"。这是乐观锁式的并发防御。
     */
    @Update({
            "UPDATE user_coupons",
            "SET status = 'USED', used_at = #{usedAt}, order_id = #{orderId}",
            "WHERE user_id = #{userId} AND coupon_id = #{couponId} AND status = 'AVAILABLE'"
    })
    int markUserCouponUsed(@Param("userId") String userId,
                           @Param("couponId") String couponId,
                           @Param("orderId") String orderId,
                           @Param("usedAt") LocalDateTime usedAt);

    /** 取消订单时:把本订单关联的券恢复成可用,以便用户重新使用。 */
    @Update({
            "UPDATE user_coupons",
            "SET status = 'AVAILABLE', used_at = NULL, order_id = NULL",
            "WHERE user_id = #{userId} AND order_id = #{orderId} AND status = 'USED'"
    })
    int restoreCouponByOrder(@Param("userId") String userId, @Param("orderId") String orderId);

    // ===== 统计同步(领券 / 用券 / 下单后调) =====

    /** 重新统计"我的"页可用券数量(根据 user_coupons 实时算)。 */
    @Update({
            "UPDATE user_profiles",
            "SET coupon_count = (",
            "  SELECT COUNT(*) FROM user_coupons",
            "  WHERE user_id = #{userId} AND status = 'AVAILABLE'",
            ")",
            "WHERE user_id = #{userId}"
    })
    int refreshCouponCount(String userId);

    /** 下单成功:累计节省金额,并刷新可用券数量。 */
    @Update({
            "UPDATE user_profiles",
            "SET saving_amount = saving_amount + #{savingAmount},",
            "    coupon_count = (",
            "      SELECT COUNT(*) FROM user_coupons",
            "      WHERE user_id = #{userId} AND status = 'AVAILABLE'",
            "    )",
            "WHERE user_id = #{userId}"
    })
    int addOrderStats(@Param("userId") String userId,
                      @Param("savingAmount") BigDecimal savingAmount);

    /**
     * 取消订单:扣回节省金额。
     * CASE WHEN 防御性写法,防止数字被扣到负数。
     */
    @Update({
            "UPDATE user_profiles",
            "SET saving_amount = CASE WHEN saving_amount > #{savingAmount} THEN saving_amount - #{savingAmount} ELSE 0 END,",
            "    coupon_count = (",
            "      SELECT COUNT(*) FROM user_coupons",
            "      WHERE user_id = #{userId} AND status = 'AVAILABLE'",
            "    )",
            "WHERE user_id = #{userId}"
    })
    int subtractOrderStats(@Param("userId") String userId,
                           @Param("savingAmount") BigDecimal savingAmount);
}
