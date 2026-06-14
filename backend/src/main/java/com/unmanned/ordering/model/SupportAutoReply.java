package com.unmanned.ordering.model;

import java.util.ArrayList;
import java.util.List;

public class SupportAutoReply {
    private String type;
    private String reply;
    private boolean needHuman;
    private List<String> quickActions = new ArrayList<>();

    public SupportAutoReply() {
    }

    public SupportAutoReply(String type, String reply, boolean needHuman, List<String> quickActions) {
        this.type = type;
        this.reply = reply;
        this.needHuman = needHuman;
        this.quickActions = quickActions == null ? new ArrayList<>() : quickActions;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public boolean isNeedHuman() {
        return needHuman;
    }

    public void setNeedHuman(boolean needHuman) {
        this.needHuman = needHuman;
    }

    public List<String> getQuickActions() {
        return quickActions;
    }

    public void setQuickActions(List<String> quickActions) {
        this.quickActions = quickActions == null ? new ArrayList<>() : quickActions;
    }
}
