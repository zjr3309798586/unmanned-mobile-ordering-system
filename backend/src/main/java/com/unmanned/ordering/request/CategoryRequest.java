package com.unmanned.ordering.request;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

// 后台新增 / 修改分类时，页面表单提交的数据结构。

/**
 * 新增/修改商品分类请求体(后台用)。
 * 字段:name(分类名)+ sort(排序权重,小的排前)。
 */
public class CategoryRequest {
    // 分类名称，例如“咖啡”“果茶”“轻食”。
    @NotBlank
    private String name;

    // 排序值，越小越靠前。
    @Min(1)
    private int sort = 1;

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
