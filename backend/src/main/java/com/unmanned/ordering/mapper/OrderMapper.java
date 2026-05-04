package com.unmanned.ordering.mapper;

import com.unmanned.ordering.model.Order;
import com.unmanned.ordering.model.OrderItem;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface OrderMapper {
    @Select({
            "<script>",
            "SELECT * FROM orders",
            "WHERE user_id = #{userId}",
            "<if test='status != null and status != \"\"'>",
            "AND status = #{status}",
            "</if>",
            "ORDER BY created_at DESC",
            "</script>"
    })
    List<Order> listOrders(@Param("userId") String userId, @Param("status") String status);

    @Select({
            "<script>",
            "SELECT * FROM orders",
            "<where>",
            "id = #{orderId}",
            "<if test='userId != null and userId != \"\"'>",
            "AND user_id = #{userId}",
            "</if>",
            "</where>",
            "</script>"
    })
    Order findOrder(@Param("orderId") String orderId, @Param("userId") String userId);

    @Select({
            "<script>",
            "SELECT * FROM orders",
            "<if test='status != null and status != \"\"'>",
            "WHERE status = #{status}",
            "</if>",
            "ORDER BY created_at DESC",
            "</script>"
    })
    List<Order> listOrdersForAdmin(@Param("status") String status);

    @Select({
            "SELECT product_id, product_name, spec, price, quantity",
            "FROM order_items",
            "WHERE order_id = #{orderId}",
            "ORDER BY id"
    })
    List<OrderItem> listOrderItems(String orderId);

    @Insert({
            "INSERT INTO orders (id, order_no, pickup_type, store_name, table_no, remark, status,",
            "user_id, total_amount, discount_amount, payable_amount, created_at)",
            "VALUES (#{id}, #{orderNo}, #{pickupType}, #{storeName}, #{tableNo}, #{remark}, #{status},",
            "#{userId},",
            "#{totalAmount}, #{discountAmount}, #{payableAmount}, #{createdAt})"
    })
    int insertOrder(Order order);

    @Insert({
            "INSERT INTO order_items (order_id, product_id, product_name, spec, price, quantity)",
            "VALUES (#{orderId}, #{item.productId}, #{item.productName}, #{item.spec}, #{item.price}, #{item.quantity})"
    })
    int insertOrderItem(@Param("orderId") String orderId, @Param("item") OrderItem item);

    @Update("UPDATE orders SET status = #{status} WHERE id = #{orderId}")
    int updateStatus(@Param("orderId") String orderId, @Param("status") String status);

    @Select("SELECT COUNT(*) FROM orders")
    int countOrders();

    @Select("SELECT COALESCE(SUM(payable_amount), 0) FROM orders WHERE status <> 'CANCELED'")
    BigDecimal sumPayableAmount();
}
