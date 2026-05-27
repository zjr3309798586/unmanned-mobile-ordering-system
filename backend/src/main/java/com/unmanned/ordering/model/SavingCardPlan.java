package com.unmanned.ordering.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 省钱卡套餐,对应 saving_card_plans 表。
 *
 * benefits 在 DB 里是字符串(JSON 或逗号分隔),
 * Java 里是 List<String>,通过 StringListTypeHandler 双向转换。
 *
 * 当前用于展示"月卡 / 季卡 / 年卡 + 含哪些权益"。
 */
public class SavingCardPlan {
    private String id;
    private String name;
    private BigDecimal price;
    private String description;
    private List<String> benefits = new ArrayList<>();

    public SavingCardPlan() {
    }

    public SavingCardPlan(String id, String name, BigDecimal price, String description, List<String> benefits) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
        this.benefits = benefits == null ? new ArrayList<>() : benefits;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getBenefits() {
        return benefits;
    }

    public void setBenefits(List<String> benefits) {
        this.benefits = benefits == null ? new ArrayList<>() : benefits;
    }
}
