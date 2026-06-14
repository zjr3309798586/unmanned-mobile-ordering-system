package com.unmanned.ordering.model;

import java.time.LocalDateTime;

/**
 * 客服工单实体。
 *
 * status 状态:
 *   PENDING  待处理
 *   REPLIED  已回复
 *   CLOSED   已关闭
 */
public class SupportTicket {
    private String id;
    private String userId;
    private String userNickname;
    private String orderId;
    private String orderNo;
    private String type;
    private String content;
    private String contact;
    private String replyContent;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime repliedAt;
    private LocalDateTime closedAt;

    public SupportTicket() {
    }

    public SupportTicket(String id, String userId, String orderId, String type, String content, String contact,
                         String replyContent, String status, LocalDateTime createdAt,
                         LocalDateTime repliedAt, LocalDateTime closedAt) {
        this.id = id;
        this.userId = userId;
        this.orderId = orderId;
        this.type = type;
        this.content = content;
        this.contact = contact;
        this.replyContent = replyContent;
        this.status = status;
        this.createdAt = createdAt;
        this.repliedAt = repliedAt;
        this.closedAt = closedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserNickname() {
        return userNickname;
    }

    public void setUserNickname(String userNickname) {
        this.userNickname = userNickname;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getReplyContent() {
        return replyContent;
    }

    public void setReplyContent(String replyContent) {
        this.replyContent = replyContent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getRepliedAt() {
        return repliedAt;
    }

    public void setRepliedAt(LocalDateTime repliedAt) {
        this.repliedAt = repliedAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }
}
