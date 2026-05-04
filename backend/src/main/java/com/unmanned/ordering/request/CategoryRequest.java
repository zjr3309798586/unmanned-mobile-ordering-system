package com.unmanned.ordering.request;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

public class CategoryRequest {
    @NotBlank
    private String name;

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
