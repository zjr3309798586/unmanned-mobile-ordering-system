package com.unmanned.ordering.mapper;

import com.unmanned.ordering.model.UserAddress;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface UserAddressMapper {
    @Select({
            "SELECT * FROM user_addresses",
            "WHERE user_id = #{userId}",
            "ORDER BY default_address DESC, updated_at DESC, created_at DESC"
    })
    List<UserAddress> listByUserId(String userId);

    @Select({
            "SELECT * FROM user_addresses",
            "WHERE id = #{id} AND user_id = #{userId}"
    })
    UserAddress findByIdAndUserId(@Param("id") String id, @Param("userId") String userId);

    @Select("SELECT COUNT(*) FROM user_addresses WHERE user_id = #{userId}")
    int countByUserId(String userId);

    @Insert({
            "INSERT INTO user_addresses (id, user_id, receiver_name, phone, address_detail, default_address, created_at, updated_at)",
            "VALUES (#{id}, #{userId}, #{receiverName}, #{phone}, #{addressDetail}, #{defaultAddress}, #{createdAt}, #{updatedAt})"
    })
    int insert(UserAddress address);

    @Update({
            "UPDATE user_addresses",
            "SET receiver_name = #{receiverName},",
            "    phone = #{phone},",
            "    address_detail = #{addressDetail},",
            "    default_address = #{defaultAddress},",
            "    updated_at = #{updatedAt}",
            "WHERE id = #{id} AND user_id = #{userId}"
    })
    int update(UserAddress address);

    @Delete("DELETE FROM user_addresses WHERE id = #{id} AND user_id = #{userId}")
    int delete(@Param("id") String id, @Param("userId") String userId);

    @Update("UPDATE user_addresses SET default_address = FALSE WHERE user_id = #{userId}")
    int clearDefault(String userId);

    @Update({
            "UPDATE user_addresses",
            "SET default_address = TRUE, updated_at = CURRENT_TIMESTAMP",
            "WHERE id = #{id} AND user_id = #{userId}"
    })
    int setDefault(@Param("id") String id, @Param("userId") String userId);

    @Update({
            "UPDATE user_addresses",
            "SET default_address = TRUE, updated_at = CURRENT_TIMESTAMP",
            "WHERE user_id = #{userId}",
            "  AND id = (",
            "    SELECT id FROM (",
            "      SELECT id FROM user_addresses",
            "      WHERE user_id = #{userId}",
            "      ORDER BY updated_at DESC, created_at DESC",
            "      LIMIT 1",
            "    ) picked",
            "  )"
    })
    int promoteLatestAsDefault(String userId);
}
