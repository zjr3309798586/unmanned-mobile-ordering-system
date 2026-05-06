package com.unmanned.ordering.request;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

// 后台新增 / 修改商品时，页面表单提交的数据结构。
public class ProductRequest {
    // 必填：商品所属分类 id，对应 categories 表的 id。
    @NotBlank
    private String categoryId;

    // 必填：商品名称。
    @NotBlank
    private String name;

    // 商品描述和图片地址可以为空；图片一般是 /images/uploads/xxx.png。
    private String description;
    private String image;

    // 必填：商品价格必须大于等于 0.01。
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;

    // 后台可手动设置销量，用于热门排序；tags 是商品标签，例如“新品”“推荐”。
    private int sales;
    private List<String> tags = new ArrayList<>();

    // enabled 控制商品是否上架。false 表示下架，前台点餐页不展示。
    private boolean enabled = true;

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
