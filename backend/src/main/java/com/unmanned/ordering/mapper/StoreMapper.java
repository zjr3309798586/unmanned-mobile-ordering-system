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

/**
 * 基础运营数据访问层 —— 负责一组"门店级"的表:
 *   stores              门店
 *   banners             首页轮播
 *   categories          商品分类
 *   coupons             优惠券规则
 *   saving_card_plans   省钱卡方案
 *
 * 这些表都是后台维护的,前台只读。
 * SQL 用 MyBatis 注解写在方法上,不用单独的 XML 文件。
 */
@Mapper
public interface StoreMapper {

    // ===== 门店 =====

    /** 首页顶部门店信息(项目只配了一个门店)。 */
    @Select("SELECT * FROM stores LIMIT 1")
    Store findStore();

    // ===== Banner =====

    /** 前台首页 Banner:只查启用中,按 sort_order 排序。 */
    @Select("SELECT id, title, subtitle, tag_text, image, link_text, link_url, sort_order AS sort, enabled FROM banners WHERE enabled = TRUE ORDER BY sort_order, id")
    List<Banner> listEnabledBanners();

    /** 后台 Banner 管理:所有 Banner(含下架的)都查出来。 */
    @Select("SELECT id, title, subtitle, tag_text, image, link_text, link_url, sort_order AS sort, enabled FROM banners ORDER BY sort_order, id")
    List<Banner> listBanners();

    /** 后台编辑 Banner 前按 ID 查询单条。 */
    @Select("SELECT id, title, subtitle, tag_text, image, link_text, link_url, sort_order AS sort, enabled FROM banners WHERE id = #{bannerId}")
    Banner findBannerById(String bannerId);

    /** 后台新增 Banner。 */
    @Insert({
            "INSERT INTO banners (id, title, subtitle, tag_text, image, link_text, link_url, sort_order, enabled)",
            "VALUES (#{id}, #{title}, #{subtitle}, #{tagText}, #{image}, #{linkText}, #{linkUrl}, #{sort}, #{enabled})"
    })
    int insertBanner(Banner banner);

    /** 后台修改 Banner(整体覆盖)。 */
    @Update({
            "UPDATE banners",
            "SET title = #{title}, subtitle = #{subtitle}, tag_text = #{tagText}, image = #{image},",
            "    link_text = #{linkText}, link_url = #{linkUrl}, sort_order = #{sort}, enabled = #{enabled}",
            "WHERE id = #{id}"
    })
    int updateBanner(Banner banner);

    /** 下架 Banner(软删除:enabled 置 false)。 */
    @Update("UPDATE banners SET enabled = FALSE WHERE id = #{bannerId}")
    int disableBanner(String bannerId);

    // ===== 分类 =====

    /** 点餐页左侧分类列表,按 sort_order 排序。 */
    @Select("SELECT id, name, sort_order AS sort FROM categories ORDER BY sort_order")
    List<Category> listCategories();

    /** 修改 / 删除分类前按 ID 查询。 */
    @Select("SELECT id, name, sort_order AS sort FROM categories WHERE id = #{categoryId}")
    Category findCategoryById(String categoryId);

    /** 后台新增分类。 */
    @Insert("INSERT INTO categories (id, name, sort_order) VALUES (#{id}, #{name}, #{sort})")
    int insertCategory(Category category);

    /** 后台修改分类(名称 + 排序)。 */
    @Update("UPDATE categories SET name = #{name}, sort_order = #{sort} WHERE id = #{id}")
    int updateCategory(Category category);

    /** 后台真删分类(Service 层会先校验该分类下没有商品)。 */
    @Delete("DELETE FROM categories WHERE id = #{categoryId}")
    int deleteCategory(String categoryId);

    // ===== 优惠券 =====

    /** 优惠券列表。前台省钱卡页 + 后台优惠券管理 都用这个。 */
    @Select("SELECT * FROM coupons ORDER BY id")
    List<Coupon> listCoupons();

    /** 领取 / 使用优惠券前按 ID 查询。 */
    @Select("SELECT * FROM coupons WHERE id = #{couponId}")
    Coupon findCouponById(String couponId);

    /** 后台新增优惠券。 */
    @Insert({
            "INSERT INTO coupons (id, title, condition_text, min_amount, discount_amount, valid_until, available)",
            "VALUES (#{id}, #{title}, #{conditionText}, #{minAmount}, #{discountAmount}, #{validUntil}, #{available})"
    })
    int insertCoupon(Coupon coupon);

    /** 后台修改优惠券(满减门槛 / 折扣 / 有效期)。 */
    @Update({
            "UPDATE coupons",
            "SET title = #{title}, condition_text = #{conditionText}, min_amount = #{minAmount}, discount_amount = #{discountAmount},",
            "    valid_until = #{validUntil}, available = #{available}",
            "WHERE id = #{id}"
    })
    int updateCoupon(Coupon coupon);

    /** 下架优惠券(软删除)。已领取的券是否仍可用,在下单时再次校验。 */
    @Update("UPDATE coupons SET available = FALSE WHERE id = #{couponId}")
    int disableCoupon(String couponId);

    // ===== 省钱卡 =====

    /**
     * 省钱卡套餐列表(月卡 / 季卡 / 年卡)。
     * benefits 字段在数据库里是字符串(JSON 或逗号分隔),Java 里是 List<String>,
     * 通过 StringListTypeHandler 做双向转换。
     */
    @Results(id = "savingCardPlanMap", value = {
            @Result(property = "benefits", column = "benefits", typeHandler = StringListTypeHandler.class)
    })
    @Select("SELECT * FROM saving_card_plans ORDER BY id")
    List<SavingCardPlan> listSavingCardPlans();

    // ===== 兜底 / 工具 =====

    /** 兼容旧的单用户资料查询,主要用于兜底测试。生产代码应使用 UserMapper.findProfileByUserId。 */
    @Select("SELECT * FROM user_profiles LIMIT 1")
    UserProfile findUserProfile();

    /** 判断分类是否存在(新增/修改商品时校验 categoryId 用)。 */
    @Select("SELECT COUNT(*) FROM categories WHERE id = #{categoryId}")
    int countCategory(String categoryId);
}
