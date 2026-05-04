package com.unmanned.ordering.mapper;

import com.unmanned.ordering.model.User;
import com.unmanned.ordering.model.UserProfile;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface UserMapper {
    @Select("SELECT * FROM users WHERE token = #{token}")
    User findByToken(String token);

    @Select("SELECT * FROM users WHERE openid = #{openid}")
    User findByOpenid(String openid);

    @Select("SELECT * FROM users WHERE id = #{userId}")
    User findById(String userId);

    @Insert({
            "INSERT INTO users (id, openid, nickname, avatar_url, token, created_at, updated_at)",
            "VALUES (#{id}, #{openid}, #{nickname}, #{avatarUrl}, #{token}, #{createdAt}, #{updatedAt})"
    })
    int insertUser(User user);

    @Update({
            "UPDATE users",
            "SET nickname = #{nickname}, avatar_url = #{avatarUrl}, token = #{token}, updated_at = CURRENT_TIMESTAMP",
            "WHERE id = #{id}"
    })
    int updateUserSession(User user);

    @Update("UPDATE users SET token = NULL, updated_at = CURRENT_TIMESTAMP WHERE token = #{token}")
    int clearToken(String token);

    @Select("SELECT * FROM user_profiles WHERE user_id = #{userId}")
    UserProfile findProfileByUserId(String userId);

    @Select("SELECT * FROM user_profiles ORDER BY user_id")
    List<UserProfile> listProfiles();

    @Insert({
            "INSERT INTO user_profiles (user_id, nickname, member_level, points, balance, coupon_count, saving_amount)",
            "VALUES (#{userId}, #{nickname}, '普通会员', 0, 0.00, 0, 0.00)"
    })
    int insertDefaultProfile(@Param("userId") String userId, @Param("nickname") String nickname);

    @Update("UPDATE user_profiles SET nickname = #{nickname} WHERE user_id = #{userId}")
    int updateProfileNickname(@Param("userId") String userId, @Param("nickname") String nickname);
}
