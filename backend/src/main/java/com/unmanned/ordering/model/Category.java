package com.unmanned.ordering.model;

/**
 * 商品分类,对应 categories 表。
 * sort 用于点餐页左侧分类栏排序,数值小的排前。
 */
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
