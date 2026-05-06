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

// OrderMapper 负责操作 orders 订单表和 order_items 订单明细表。
@Mapper
public interface OrderMapper {
    // 用户端订单页：查询当前用户订单，可按状态筛选。
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

    // 查询订单详情。userId 不为空时会限制只能查自己的订单，后台查询时可以传 null。
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

    // 后台订单管理：查询全部用户订单，可按状态筛选。
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

    // 查询订单里的商品明细。
    @Select({
            "SELECT product_id, product_name, spec, price, quantity",
            "FROM order_items",
            "WHERE order_id = #{orderId}",
            "ORDER BY id"
    })
    List<OrderItem> listOrderItems(String orderId);

    // 新建订单主表记录。
    @Insert({
            "INSERT INTO orders (id, order_no, pickup_type, store_name, table_no, remark, status,",
            "user_id, total_amount, discount_amount, payable_amount, created_at)",
            "VALUES (#{id}, #{orderNo}, #{pickupType}, #{storeName}, #{tableNo}, #{remark}, #{status},",
            "#{userId},",
            "#{totalAmount}, #{discountAmount}, #{payableAmount}, #{createdAt})"
    })
    int insertOrder(Order order);

    // 新建订单明细记录。一个订单里有几个商品，就会插入几条 order_items。
    @Insert({
            "INSERT INTO order_items (order_id, product_id, product_name, spec, price, quantity)",
            "VALUES (#{orderId}, #{item.productId}, #{item.productName}, #{item.spec}, #{item.price}, #{item.quantity})"
    })
    int insertOrderItem(@Param("orderId") String orderId, @Param("item") OrderItem item);

    // 修改订单状态，比如 PENDING -> COMPLETED 或 CANCELED。
    @Update("UPDATE orders SET status = #{status} WHERE id = #{orderId}")
    int updateStatus(@Param("orderId") String orderId, @Param("status") String status);

    // 后台首页统计订单数量。
    @Select("SELECT COUNT(*) FROM orders")
    int countOrders();

    // 后台首页统计成交金额，取消订单不计入收入。
    @Select("SELECT COALESCE(SUM(payable_amount), 0) FROM orders WHERE status <> 'CANCELED'")
    BigDecimal sumPayableAmount();
}
