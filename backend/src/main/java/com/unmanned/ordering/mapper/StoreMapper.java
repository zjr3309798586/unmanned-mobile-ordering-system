package com.unmanned.ordering.mapper;

import com.unmanned.ordering.config.StringListTypeHandler;
import com.unmanned.ordering.model.Category;
import com.unmanned.ordering.model.Coupon;
import com.unmanned.ordering.model.SavingCardPlan;
import com.unmanned.ordering.model.Store;
import com.unmanned.ordering.model.UserProfile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface StoreMapper {
    @Select("SELECT * FROM stores LIMIT 1")
    Store findStore();

    @Select("SELECT id, name, sort_order AS sort FROM categories ORDER BY sort_order")
    List<Category> listCategories();

    @Select("SELECT * FROM coupons ORDER BY id")
    List<Coupon> listCoupons();

    @Results(id = "savingCardPlanMap", value = {
            @Result(property = "benefits", column = "benefits", typeHandler = StringListTypeHandler.class)
    })
    @Select("SELECT * FROM saving_card_plans ORDER BY id")
    List<SavingCardPlan> listSavingCardPlans();

    @Select("SELECT * FROM user_profiles LIMIT 1")
    UserProfile findUserProfile();

    @Select("SELECT COUNT(*) FROM categories WHERE id = #{categoryId}")
    int countCategory(String categoryId);
}
