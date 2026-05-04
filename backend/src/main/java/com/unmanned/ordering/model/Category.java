package com.unmanned.ordering.model;

public class Category {
    private String id;
    private String name;
    private int sort;

    public Category() {
    }

    public Category(String id, String name, int sort) {
        this.id = id;
        this.name = name;
        this.sort = sort;
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

    public int getSort() {
        return sort;
    }

    public void setSort(int sort) {
        this.sort = sort;
    }
}
