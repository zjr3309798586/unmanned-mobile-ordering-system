package com.unmanned.ordering.request;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

// 购物车页修改商品数量时，前端传给后端的数据结构。

/**
 * 修改购物车数量请求体。
 * 字段:quantity(新数量,>=1)。
 */
public class UpdateCartItemRequest {
    // 数量必须传，并且最少为 1；删除商品要调用 DELETE 接口，不是把数量改成 0。
    @NotNull
    @Min(1)
    private Integer quantity;

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
