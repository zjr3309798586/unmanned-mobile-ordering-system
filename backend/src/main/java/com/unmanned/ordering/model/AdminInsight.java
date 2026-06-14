package com.unmanned.ordering.model;

public class AdminInsight {
    private String level;
    private String title;
    private String content;
    private String actionText;
    private String actionUrl;

    public AdminInsight() {
    }

    public AdminInsight(String level, String title, String content, String actionText, String actionUrl) {
        this.level = level;
        this.title = title;
        this.content = content;
        this.actionText = actionText;
        this.actionUrl = actionUrl;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getActionText() {
        return actionText;
    }

    public void setActionText(String actionText) {
        this.actionText = actionText;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }
}
