package com.unmanned.ordering.request;

import javax.validation.constraints.NotBlank;

// 后台新增 / 修改首页 Banner 时，页面表单提交的数据结构。
public class BannerRequest {
    // Banner 主标题。
    @NotBlank
    private String title;

    // 副标题、角标、图片地址、跳转文字和跳转链接都可以按运营需要填写。
    private String subtitle;
    private String tagText;
    private String image;
    private String linkText;
    private String linkUrl;

    // sort 越小越靠前；enabled=false 表示下架，不在前台首页展示。
    private int sort;
    private boolean enabled = true;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getTagText() {
        return tagText;
    }

    public void setTagText(String tagText) {
        this.tagText = tagText;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getLinkText() {
        return linkText;
    }

    public void setLinkText(String linkText) {
        this.linkText = linkText;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public void setLinkUrl(String linkUrl) {
        this.linkUrl = linkUrl;
    }

    public int getSort() {
        return sort;
    }

    public void setSort(int sort) {
        this.sort = sort;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
