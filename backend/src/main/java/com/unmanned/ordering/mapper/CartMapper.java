package com.unmanned.ordering.mapper;

import com.unmanned.ordering.model.CartItem;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface CartMapper {
    @Select({
            "SELECT c.id, c.product_id, p.name AS product_name, c.spec, p.image, p.price, c.quantity",
            "FROM cart_items c",
            "JOIN products p ON p.id = c.product_id",
            "ORDER BY c.created_at"
    })
    List<CartItem> listCartItems();

    @Select({
            "SELECT c.id, c.product_id, p.name AS product_name, c.spec, p.image, p.price, c.quantity",
            "FROM cart_items c",
            "JOIN products p ON p.id = c.product_id",
            "WHERE c.product_id = #{productId} AND c.spec = #{spec}"
    })
    CartItem findByProductAndSpec(@Param("productId") String productId, @Param("spec") String spec);

    @Select("SELECT COUNT(*) FROM cart_items WHERE id = #{itemId}")
    int countById(String itemId);

    @Select("SELECT COUNT(*) FROM cart_items")
    int countItems();

    @Insert({
            "INSERT INTO cart_items (id, product_id, spec, quantity, created_at)",
            "VALUES (#{id}, #{productId}, #{spec}, #{quantity}, CURRENT_TIMESTAMP)"
    })
    int insert(@Param("id") String id,
               @Param("productId") String productId,
               @Param("spec") String spec,
               @Param("quantity") int quantity);

    @Update("UPDATE cart_items SET quantity = quantity + #{quantity} WHERE id = #{itemId}")
    int increaseQuantity(@Param("itemId") String itemId, @Param("quantity") int quantity);

    @Update("UPDATE cart_items SET quantity = #{quantity} WHERE id = #{itemId}")
    int updateQuantity(@Param("itemId") String itemId, @Param("quantity") int quantity);

    @Delete("DELETE FROM cart_items WHERE id = #{itemId}")
    int deleteById(String itemId);

    @Delete("DELETE FROM cart_items")
    int clear();
}
