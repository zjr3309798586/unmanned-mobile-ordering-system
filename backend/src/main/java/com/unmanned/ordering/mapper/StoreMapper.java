package com.unmanned.ordering.mapper;

import com.unmanned.ordering.config.StringListTypeHandler;
import com.unmanned.ordering.model.Banner;
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

// StoreMapper 负责门店、Banner、分类、优惠券、省钱卡等基础运营数据。
@Mapper
public interface StoreMapper {
    // 首页顶部门店信息。
    @Select("SELECT * FROM stores LIMIT 1")
    Store findStore();

    // 前台首页 Banner：只查启用中的 Banner。
    @Select("SELECT id, title, subtitle, tag_text, image, link_text, link_url, sort_order AS sort, enabled FROM banners WHERE enabled = TRUE ORDER BY sort_order, id")
    List<Banner> listEnabledBanners();

    // 后台 Banner 管理：所有 Banner 都查出来。
    @Select("SELECT id, title, subtitle, tag_text, image, link_text, link_url, sort_order AS sort, enabled FROM banners ORDER BY sort_order, id")
    List<Banner> listBanners();

    // 后台编辑 Banner 前按 id 查询。
    @Select("SELECT id, title, subtitle, tag_text, image, link_text, link_url, sort_order AS sort, enabled FROM banners WHERE id = #{bannerId}")
    Banner findBannerById(String bannerId);

    // 后台新增 Banner。
    @Insert({
            "INSERT INTO banners (id, title, subtitle, tag_text, image, link_text, link_url, sort_order, enabled)",
            "VALUES (#{id}, #{title}, #{subtitle}, #{tagText}, #{image}, #{linkText}, #{linkUrl}, #{sort}, #{enabled})"
    })
    int insertBanner(Banner banner);

    // 后台修改 Banner。
    @Update({
            "UPDATE banners",
            "SET title = #{title}, subtitle = #{subtitle}, tag_text = #{tagText}, image = #{image},",
            "    link_text = #{linkText}, link_url = #{linkUrl}, sort_order = #{sort}, enabled = #{enabled}",
            "WHERE id = #{id}"
    })
    int updateBanner(Banner banner);

    // 下架 Banner。
    @Update("UPDATE banners SET enabled = FALSE WHERE id = #{bannerId}")
    int disableBanner(String bannerId);

    // 点餐页左侧分类。
    @Select("SELECT id, name, sort_order AS sort FROM categories ORDER BY sort_order")
    List<Category> listCategories();

    // 修改分类或删除分类前按 id 查询。
    @Select("SELECT id, name, sort_order AS sort FROM categories WHERE id = #{categoryId}")
    Category findCategoryById(String categoryId);

    // 后台新增分类。
    @Insert("INSERT INTO categories (id, name, sort_order) VALUES (#{id}, #{name}, #{sort})")
    int insertCategory(Category category);

    // 后台修改分类。
    @Update("UPDATE categories SET name = #{name}, sort_order = #{sort} WHERE id = #{id}")
    int updateCategory(Category category);

    // 后台删除分类。
    @Delete("DELETE FROM categories WHERE id = #{categoryId}")
    int deleteCategory(String categoryId);

    // 前台省钱卡页和后台优惠券管理都会用到。
    @Select("SELECT * FROM coupons ORDER BY id")
    List<Coupon> listCoupons();

    // 领取 / 使用优惠券前按 id 查询。
    @Select("SELECT * FROM coupons WHERE id = #{couponId}")
    Coupon findCouponById(String couponId);

    // 后台新增优惠券。
    @Insert({
            "INSERT INTO coupons (id, title, condition_text, min_amount, discount_amount, valid_until, available)",
            "VALUES (#{id}, #{title}, #{conditionText}, #{minAmount}, #{discountAmount}, #{validUntil}, #{available})"
    })
    int insertCoupon(Coupon coupon);

    // 后台修改优惠券。
    @Update({
            "UPDATE coupons",
            "SET title = #{title}, condition_text = #{conditionText}, min_amount = #{minAmount}, discount_amount = #{discountAmount},",
            "    valid_until = #{validUntil}, available = #{available}",
            "WHERE id = #{id}"
    })
    int updateCoupon(Coupon coupon);

    // 下架优惠券。
    @Update("UPDATE coupons SET available = FALSE WHERE id = #{couponId}")
    int disableCoupon(String couponId);

    // 省钱卡套餐列表，benefits 字段需要从字符串转换成 List<String>。
    @Results(id = "savingCardPlanMap", value = {
            @Result(property = "benefits", column = "benefits", typeHandler = StringListTypeHandler.class)
    })
    @Select("SELECT * FROM saving_card_plans ORDER BY id")
    List<SavingCardPlan> listSavingCardPlans();

    // 兼容旧的单用户资料查询，主要用于兜底。
    @Select("SELECT * FROM user_profiles LIMIT 1")
    UserProfile findUserProfile();

    // 判断分类是否存在。
    @Select("SELECT COUNT(*) FROM categories WHERE id = #{categoryId}")
    int countCategory(String categoryId);
}
