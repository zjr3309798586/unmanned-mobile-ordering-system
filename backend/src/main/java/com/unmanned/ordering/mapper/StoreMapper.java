package com.unmanned.ordering.mapper;

import com.unmanned.ordering.config.StringListTypeHandler;
import com.unmanned.ordering.model.Category;
import com.unmanned.ordering.model.Coupon;
import com.unmanned.ordering.model.SavingCardPlan;
import com.unmanned.ordering.model.Store;
import com.unmanned.ordering.model.UserProfile;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface StoreMapper {
    @Select("SELECT * FROM stores LIMIT 1")
    Store findStore();

    @Select("SELECT id, name, sort_order AS sort FROM categories ORDER BY sort_order")
    List<Category> listCategories();

    @Select("SELECT id, name, sort_order AS sort FROM categories WHERE id = #{categoryId}")
    Category findCategoryById(String categoryId);

    @Insert("INSERT INTO categories (id, name, sort_order) VALUES (#{id}, #{name}, #{sort})")
    int insertCategory(Category category);

    @Update("UPDATE categories SET name = #{name}, sort_order = #{sort} WHERE id = #{id}")
    int updateCategory(Category category);

    @Delete("DELETE FROM categories WHERE id = #{categoryId}")
    int deleteCategory(String categoryId);

    @Select("SELECT * FROM coupons ORDER BY id")
    List<Coupon> listCoupons();

    @Select("SELECT * FROM coupons WHERE id = #{couponId}")
    Coupon findCouponById(String couponId);

    @Insert({
            "INSERT INTO coupons (id, title, condition_text, discount_amount, valid_until, available)",
            "VALUES (#{id}, #{title}, #{conditionText}, #{discountAmount}, #{validUntil}, #{available})"
    })
    int insertCoupon(Coupon coupon);

    @Update({
            "UPDATE coupons",
            "SET title = #{title}, condition_text = #{conditionText}, discount_amount = #{discountAmount},",
            "    valid_until = #{validUntil}, available = #{available}",
            "WHERE id = #{id}"
    })
    int updateCoupon(Coupon coupon);

    @Update("UPDATE coupons SET available = FALSE WHERE id = #{couponId}")
    int disableCoupon(String couponId);

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
