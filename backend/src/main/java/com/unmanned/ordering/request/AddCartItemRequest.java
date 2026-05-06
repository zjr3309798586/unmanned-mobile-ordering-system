package com.unmanned.ordering.request;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

// 加入购物车时，前端传给后端的数据结构。
public class AddCartItemRequest {
    // 必填：要加入购物车的商品 id，对应 products 表的 id。
    @NotBlank
    private String productId;

    // 规格文字，比如“少冰 / 半糖 / 加椰果”。没有选择时可以为空。
    private String spec;

    // 数量最少为 1。@Min(1) 会让 Spring 自动拦截 0 或负数。
    @Min(1)
    private int quantity = 1;

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getSpec() {
        return spec;
    }

    public void setSpec(String spec) {
        this.spec = spec;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
