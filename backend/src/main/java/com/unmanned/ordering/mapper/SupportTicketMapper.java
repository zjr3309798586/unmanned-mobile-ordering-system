package com.unmanned.ordering.mapper;

import com.unmanned.ordering.model.SupportTicket;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 客服工单数据访问层。
 */
@Mapper
public interface SupportTicketMapper {

    @Select({
            "SELECT t.*, u.nickname AS user_nickname, o.order_no AS order_no",
            "FROM support_tickets t",
            "LEFT JOIN users u ON t.user_id = u.id",
            "LEFT JOIN orders o ON t.order_id = o.id",
            "WHERE t.user_id = #{userId}",
            "ORDER BY t.created_at DESC"
    })
    List<SupportTicket> listByUser(String userId);

    @Select({
            "<script>",
            "SELECT t.*, u.nickname AS user_nickname, o.order_no AS order_no",
            "FROM support_tickets t",
            "LEFT JOIN users u ON t.user_id = u.id",
            "LEFT JOIN orders o ON t.order_id = o.id",
            "<if test='status != null and status != \"\"'>",
            "WHERE t.status = #{status}",
            "</if>",
            "ORDER BY t.created_at DESC",
            "</script>"
    })
    List<SupportTicket> listForAdmin(@Param("status") String status);

    @Select({
            "SELECT t.*, u.nickname AS user_nickname, o.order_no AS order_no",
            "FROM support_tickets t",
            "LEFT JOIN users u ON t.user_id = u.id",
            "LEFT JOIN orders o ON t.order_id = o.id",
            "WHERE t.id = #{ticketId}"
    })
    SupportTicket findById(String ticketId);

    @Insert({
            "INSERT INTO support_tickets (id, user_id, order_id, type, content, contact, reply_content, status,",
            "created_at, replied_at, closed_at)",
            "VALUES (#{id}, #{userId}, #{orderId}, #{type}, #{content}, #{contact}, #{replyContent}, #{status},",
            "#{createdAt}, #{repliedAt}, #{closedAt})"
    })
    int insert(SupportTicket ticket);

    @Update({
            "UPDATE support_tickets",
            "SET reply_content = #{replyContent}, status = 'REPLIED', replied_at = #{repliedAt}",
            "WHERE id = #{ticketId}"
    })
    int reply(@Param("ticketId") String ticketId,
              @Param("replyContent") String replyContent,
              @Param("repliedAt") LocalDateTime repliedAt);

    @Update({
            "UPDATE support_tickets",
            "SET status = 'CLOSED', closed_at = #{closedAt}",
            "WHERE id = #{ticketId}"
    })
    int close(@Param("ticketId") String ticketId,
              @Param("closedAt") LocalDateTime closedAt);

    @Delete({
            "DELETE FROM support_tickets",
            "WHERE status = 'PENDING'",
            "AND (reply_content IS NULL OR reply_content = '')",
            "AND (",
            "content IN ('你好', '000', '我想咨询优惠券或省钱卡使用问题。', '我想咨询取餐进度，请帮我查看。',",
            "'我想取消或修改订单，请帮我处理。', '我收到的商品口味或规格有问题，请帮我确认。')",
            "OR content LIKE '%测试%'",
            "OR LOWER(content) LIKE '%test%'",
            "OR contact = '13800000000'",
            ")"
    })
    int deleteTestTickets();
}
