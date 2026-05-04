package com.unmanned.ordering.request;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

public class AddCartItemRequest {
    @NotBlank
    private String productId;

    private String spec;

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
