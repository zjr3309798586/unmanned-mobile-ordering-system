package com.unmanned.ordering.model;

public class Banner {
    private String id;
    private String title;
    private String subtitle;
    private String tagText;
    private String image;
    private String linkText;
    private String linkUrl;
    private int sort;
    private boolean enabled;

    public Banner() {
    }

    public Banner(String id, String title, String subtitle, String tagText, String image,
                  String linkText, String linkUrl, int sort, boolean enabled) {
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.tagText = tagText;
        this.image = image;
        this.linkText = linkText;
        this.linkUrl = linkUrl;
        this.sort = sort;
        this.enabled = enabled;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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
