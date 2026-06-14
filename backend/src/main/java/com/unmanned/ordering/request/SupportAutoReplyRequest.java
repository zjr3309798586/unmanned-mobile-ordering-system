package com.unmanned.ordering.request;

import javax.validation.constraints.NotBlank;

public class SupportAutoReplyRequest {
    @NotBlank(message = "请输入问题内容")
    private String content;

    private String type;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
