package com.unmanned.ordering.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 商品实体,对应 products 表。
 *
 * 关键字段:
 *   categoryId    所属分类
 *   image         商品图(/images/menu/X.png)
 *   price         单价(BigDecimal)
 *   sales         销量(下单 +N,取消订单 -N,不能为负)
 *   tags          标签列表(在 DB 里存字符串,通过 StringListTypeHandler 转 List)
 *   enabled       是否上架(false 表示已下架)
 */
public class Product {
    private String id;
    private String categoryId;
    private String name;
    private String description;
    private String image;
    private BigDecimal price;
    private int sales;
    private List<String> tags = new ArrayList<>();
    private boolean enabled;

    public Product() {
    }

    public Product(String id, String categoryId, String name, String description, String image,
                   BigDecimal price, int sales, List<String> tags, boolean enabled) {
        this.id = id;
        this.categoryId = categoryId;
        this.name = name;
        this.description = description;
        this.image = image;
        this.price = price;
        this.sales = sales;
        this.tags = tags == null ? new ArrayList<>() : tags;
        this.enabled = enabled;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public int getSales() {
        return sales;
    }

    public void setSales(int sales) {
        this.sales = sales;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags == null ? new ArrayList<>() : tags;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
