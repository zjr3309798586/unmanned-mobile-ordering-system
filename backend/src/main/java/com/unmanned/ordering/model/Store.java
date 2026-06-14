package com.unmanned.ordering.model;

/**
 * 门店实体,对应 stores 表。
 *
 * 项目当前只配置了一个门店(云豹双流北京华联店),
 * 所有页面顶部显示的门店名 / 地址 / 营业时间都来自这条记录。
 */
public class Store {
    private String id;
    private String name;
    private String address;
    private String distance;
    private String businessHours;
    private String notice;
    private int queueCupCount;
    private int queueOrderCount;

    public Store() {
    }

    public Store(String id, String name, String address, String distance, String businessHours, String notice) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.distance = distance;
        this.businessHours = businessHours;
        this.notice = notice;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDistance() {
        return distance;
    }

    public void setDistance(String distance) {
        this.distance = distance;
    }

    public String getBusinessHours() {
        return businessHours;
    }

    public void setBusinessHours(String businessHours) {
        this.businessHours = businessHours;
    }

    public String getNotice() {
        return notice;
    }

    public void setNotice(String notice) {
        this.notice = notice;
    }

    public int getQueueCupCount() {
        return queueCupCount;
    }

    public void setQueueCupCount(int queueCupCount) {
        this.queueCupCount = queueCupCount;
    }

    public int getQueueOrderCount() {
        return queueOrderCount;
    }

    public void setQueueOrderCount(int queueOrderCount) {
        this.queueOrderCount = queueOrderCount;
    }
}
