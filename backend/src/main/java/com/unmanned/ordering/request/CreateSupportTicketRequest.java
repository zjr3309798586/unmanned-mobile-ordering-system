package com.unmanned.ordering.request;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 用户提交客服留言时传给后端的数据。
 */
public class CreateSupportTicketRequest {
    @NotBlank
    @Size(max = 40)
    private String type;

    @Size(max = 40)
    private String orderId;

    @NotBlank
    @Size(max = 1000)
    private String content;

    @Size(max = 100)
    private String contact;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
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
}
