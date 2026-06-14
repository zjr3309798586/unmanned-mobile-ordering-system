package com.unmanned.ordering.request;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 管理员回复客服工单时传给后端的数据。
 */
public class ReplySupportTicketRequest {
    @NotBlank
    @Size(max = 1000)
    private String replyContent;

    public String getReplyContent() {
        return replyContent;
    }

    public void setReplyContent(String replyContent) {
        this.replyContent = replyContent;
    }
}
