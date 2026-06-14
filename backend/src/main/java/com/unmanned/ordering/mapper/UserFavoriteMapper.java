package com.unmanned.ordering.mapper;

import com.unmanned.ordering.config.StringListTypeHandler;
import com.unmanned.ordering.model.Product;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户口味收藏数据访问层。
 *
 * user_favorites 只保存 user_id + product_id,页面展示所需的商品名、图片、价格
 * 通过 JOIN products 实时读取,避免收藏表里冗余商品信息。
 */
@Mapper
public interface UserFavoriteMapper {

    @Results(id = "favoriteProductMap", value = {
            @Result(property = "tags", column = "tags", typeHandler = StringListTypeHandler.class)
    })
    @Select({
            "SELECT p.*",
            "FROM user_favorites f",
            "JOIN products p ON f.product_id = p.id",
            "WHERE f.user_id = #{userId} AND p.enabled = TRUE",
            "ORDER BY f.created_at DESC"
    })
    List<Product> listProducts(String userId);

    @Select("SELECT COUNT(*) FROM user_favorites WHERE user_id = #{userId} AND product_id = #{productId}")
    int countFavorite(@Param("userId") String userId, @Param("productId") String productId);

    @Insert({
            "INSERT INTO user_favorites (user_id, product_id, created_at)",
            "VALUES (#{userId}, #{productId}, #{createdAt})"
    })
    int insertFavorite(@Param("userId") String userId,
                       @Param("productId") String productId,
                       @Param("createdAt") LocalDateTime createdAt);

    @Delete("DELETE FROM user_favorites WHERE user_id = #{userId} AND product_id = #{productId}")
    int deleteFavorite(@Param("userId") String userId, @Param("productId") String productId);
}
