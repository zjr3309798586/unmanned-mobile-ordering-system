package com.unmanned.ordering.mapper;

import com.unmanned.ordering.model.CartItem;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 购物车表数据访问层 —— 操作 cart_items 表。
 *
 * 关键设计:
 *   1. 所有写操作都带 user_id 限定,确保用户只能操作自己的购物车。
 *   2. 同用户 + 同商品 + 同规格 在表里只保留一条(数量累加),不重复行。
 *   3. 商品名 / 图片 / 价格 不存在 cart_items 表,通过 JOIN products 实时拿,
 *      这样商品后台改价后,购物车显示的价格也会跟着变。
 */
@Mapper
public interface CartMapper {

    /**
     * 查询某用户的购物车明细。
     * JOIN products 把商品名、图、价拉过来,以便前端一次拿全。
     */
    @Select({
            "SELECT c.id, c.product_id, p.name AS product_name, c.spec, p.image, p.price, c.quantity",
            "FROM cart_items c",
            "JOIN products p ON p.id = c.product_id",
            "WHERE c.user_id = #{userId}",
            "ORDER BY c.created_at"
    })
    List<CartItem> listCartItems(String userId);

    /**
     * 加购前查询:用户是否已经有"同商品 + 同规格"的购物车项。
     * 有 → 累加数量;没有 → 新增一条。
     */
    @Select({
            "SELECT c.id, c.product_id, p.name AS product_name, c.spec, p.image, p.price, c.quantity",
            "FROM cart_items c",
            "JOIN products p ON p.id = c.product_id",
            "WHERE c.user_id = #{userId} AND c.product_id = #{productId} AND c.spec = #{spec}"
    })
    CartItem findByProductAndSpec(@Param("userId") String userId,
                                  @Param("productId") String productId,
                                  @Param("spec") String spec);

    /** 后台首页统计:全平台购物车条目总数。 */
    @Select("SELECT COUNT(*) FROM cart_items")
    int countItems();

    /** 新增购物车记录(同商品+规格不存在时调用)。 */
    @Insert({
            "INSERT INTO cart_items (id, user_id, product_id, spec, quantity, created_at)",
            "VALUES (#{id}, #{userId}, #{productId}, #{spec}, #{quantity}, CURRENT_TIMESTAMP)"
    })
    int insertForUser(@Param("id") String id,
                      @Param("userId") String userId,
                      @Param("productId") String productId,
                      @Param("spec") String spec,
                      @Param("quantity") int quantity);

    /** 在已有的购物车项上累加数量(同商品+规格存在时调用)。 */
    @Update("UPDATE cart_items SET quantity = quantity + #{quantity} WHERE id = #{itemId} AND user_id = #{userId}")
    int increaseQuantity(@Param("userId") String userId,
                         @Param("itemId") String itemId,
                         @Param("quantity") int quantity);

    /** 直接覆盖某项数量(购物车页 + / - 按钮使用)。带 user_id 防越权。 */
    @Update("UPDATE cart_items SET quantity = #{quantity} WHERE id = #{itemId} AND user_id = #{userId}")
    int updateQuantity(@Param("userId") String userId,
                       @Param("itemId") String itemId,
                       @Param("quantity") int quantity);

    /** 删除购物车单项。带 user_id 防越权。 */
    @Delete("DELETE FROM cart_items WHERE id = #{itemId} AND user_id = #{userId}")
    int deleteById(@Param("userId") String userId, @Param("itemId") String itemId);

    /** 清空指定用户的购物车(下单成功后自动调用)。 */
    @Delete("DELETE FROM cart_items WHERE user_id = #{userId}")
    int clear(String userId);
}
