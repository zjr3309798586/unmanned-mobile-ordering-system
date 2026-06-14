package com.unmanned.ordering.model;

public class ProductRecommendation {
    private Product product;
    private String reason;
    private String tag;
    private int score;

    public ProductRecommendation() {
    }

    public ProductRecommendation(Product product, String reason, String tag, int score) {
        this.product = product;
        this.reason = reason;
        this.tag = tag;
        this.score = score;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }
}
