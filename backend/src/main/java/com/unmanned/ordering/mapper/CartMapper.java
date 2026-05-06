package com.unmanned.ordering.mapper;

import com.unmanned.ordering.model.CartItem;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

// CartMapper 负责操作 cart_items 购物车表。
@Mapper
public interface CartMapper {
    // 查询某个用户的购物车，并联表 products 拿到商品名称、图片、价格。
    @Select({
            "SELECT c.id, c.product_id, p.name AS product_name, c.spec, p.image, p.price, c.quantity",
            "FROM cart_items c",
            "JOIN products p ON p.id = c.product_id",
            "WHERE c.user_id = #{userId}",
            "ORDER BY c.created_at"
    })
    List<CartItem> listCartItems(String userId);

    // 加购物车前先查同一个用户、同一个商品、同一个规格是否已经存在。
    @Select({
            "SELECT c.id, c.product_id, p.name AS product_name, c.spec, p.image, p.price, c.quantity",
            "FROM cart_items c",
            "JOIN products p ON p.id = c.product_id",
            "WHERE c.user_id = #{userId} AND c.product_id = #{productId} AND c.spec = #{spec}"
    })
    CartItem findByProductAndSpec(@Param("userId") String userId,
                                  @Param("productId") String productId,
                                  @Param("spec") String spec);

    // 后台首页统计购物车条目数量。
    @Select("SELECT COUNT(*) FROM cart_items")
    int countItems();

    // 购物车中没有该商品规格时，新增一条记录。
    @Insert({
            "INSERT INTO cart_items (id, user_id, product_id, spec, quantity, created_at)",
            "VALUES (#{id}, #{userId}, #{productId}, #{spec}, #{quantity}, CURRENT_TIMESTAMP)"
    })
    int insertForUser(@Param("id") String id,
                      @Param("userId") String userId,
                      @Param("productId") String productId,
                      @Param("spec") String spec,
                      @Param("quantity") int quantity);

    // 购物车中已经有该商品规格时，只增加数量。
    @Update("UPDATE cart_items SET quantity = quantity + #{quantity} WHERE id = #{itemId} AND user_id = #{userId}")
    int increaseQuantity(@Param("userId") String userId,
                         @Param("itemId") String itemId,
                         @Param("quantity") int quantity);

    // 购物车页加减数量时使用。
    @Update("UPDATE cart_items SET quantity = #{quantity} WHERE id = #{itemId} AND user_id = #{userId}")
    int updateQuantity(@Param("userId") String userId,
                       @Param("itemId") String itemId,
                       @Param("quantity") int quantity);

    // 删除购物车中的单个商品。
    @Delete("DELETE FROM cart_items WHERE id = #{itemId} AND user_id = #{userId}")
    int deleteById(@Param("userId") String userId, @Param("itemId") String itemId);

    // 提交订单成功后清空当前用户购物车。
    @Delete("DELETE FROM cart_items WHERE user_id = #{userId}")
    int clear(String userId);
}
