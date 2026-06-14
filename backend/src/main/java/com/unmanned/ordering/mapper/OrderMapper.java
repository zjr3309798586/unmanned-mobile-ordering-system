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

/**
 * 订单表数据访问层 —— 操作 orders 订单主表 + order_items 订单明细表。
 *
 * 一笔订单 = 1 条 orders + N 条 order_items(每个商品规格一条)。
 * 主表存订单的"全局信息"(订单号、状态、金额),
 * 明细表存"当时下单时的商品快照"(名字、规格、价格冻结)。
 */
@Mapper
public interface OrderMapper {

    // ===== 查询 =====

    /**
     * 前台订单列表:当前用户的订单,可按状态过滤。
     * 用 <script> 动态拼:status 不传就返回该用户所有订单。
     */
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

    /**
     * 订单详情。
     * userId 传值时限定"只能查自己的订单"(前台用,防越权)。
     * userId 传 null 时不限制(后台用,任何订单都能查)。
     */
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

    /** 后台订单管理:所有用户的订单,可按状态过滤。 */
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

    /** 查订单里的商品明细(由 OrderingService.attachOrderItems 调用拼回主单)。 */
    @Select({
            "SELECT product_id, product_name, spec, price, quantity",
            "FROM order_items",
            "WHERE order_id = #{orderId}",
            "ORDER BY id"
    })
    List<OrderItem> listOrderItems(String orderId);

    // ===== 写入 =====

    /** 新建订单主表。订单号 / 状态 / 金额都已经在 Service 层算好。 */
    @Insert({
            "INSERT INTO orders (id, order_no, pickup_type, store_name, table_no, delivery_address, delivery_contact, delivery_fee, remark, status,",
            "user_id, total_amount, discount_amount, payable_amount, created_at)",
            "VALUES (#{id}, #{orderNo}, #{pickupType}, #{storeName}, #{tableNo}, #{deliveryAddress}, #{deliveryContact}, #{deliveryFee}, #{remark}, #{status},",
            "#{userId},",
            "#{totalAmount}, #{discountAmount}, #{payableAmount}, #{createdAt})"
    })
    int insertOrder(Order order);

    /** 新建订单明细。一个订单有 N 个商品 → 调 N 次。 */
    @Insert({
            "INSERT INTO order_items (order_id, product_id, product_name, spec, price, quantity)",
            "VALUES (#{orderId}, #{item.productId}, #{item.productName}, #{item.spec}, #{item.price}, #{item.quantity})"
    })
    int insertOrderItem(@Param("orderId") String orderId, @Param("item") OrderItem item);

    /** 修改订单状态。例如 WAITING_PICKUP → COMPLETED 或 CANCELED。 */
    @Update("UPDATE orders SET status = #{status} WHERE id = #{orderId}")
    int updateStatus(@Param("orderId") String orderId, @Param("status") String status);

    // ===== 统计(后台首页看板) =====

    /** 全平台订单总数。 */
    @Select("SELECT COUNT(*) FROM orders")
    int countOrders();

    /** 已成交订单总金额(已取消订单不计入)。 */
    @Select("SELECT COALESCE(SUM(payable_amount), 0) FROM orders WHERE status <> 'CANCELED'")
    BigDecimal sumPayableAmount();

    /** Current making order count for queue display. */
    @Select("SELECT COUNT(*) FROM orders WHERE status = 'MAKING'")
    int countMakingOrders();

    /** Current making item quantity for queue display. */
    @Select({
            "SELECT COALESCE(SUM(item.quantity), 0)",
            "FROM order_items item",
            "JOIN orders o ON o.id = item.order_id",
            "WHERE o.status = 'MAKING'"
    })
    int sumMakingCups();
}
