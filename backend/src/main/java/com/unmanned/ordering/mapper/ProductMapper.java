package com.unmanned.ordering.mapper;

import com.unmanned.ordering.config.StringListTypeHandler;
import com.unmanned.ordering.model.Product;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 商品表数据访问层 —— 操作 products 表。
 *
 * 特殊点:tags 字段在数据库里是字符串(JSON 或逗号分隔),
 * 在 Java 里是 List<String>,通过 StringListTypeHandler 做双向转换。
 * @Results(id="productMap") 定义后,其他查询用 @ResultMap("productMap") 复用。
 */
@Mapper
public interface ProductMapper {

    /**
     * 前台商品列表(支持分类筛选 + 关键词搜索)。
     *
     * SQL 用 MyBatis 的 <script> 动态拼接:
     *   - WHERE enabled = TRUE     只查上架商品
     *   - 如果传了 categoryId,AND category_id = ?
     *   - 如果传了 keyword,AND (name LIKE %?% OR description LIKE %?%) ,忽略大小写
     *   - ORDER BY sales DESC      销量高的排前面
     */
    @Results(id = "productMap", value = {
            @Result(property = "tags", column = "tags", typeHandler = StringListTypeHandler.class)
    })
    @Select({
            "<script>",
            "SELECT * FROM products",
            "WHERE enabled = TRUE",
            "<if test='categoryId != null and categoryId != \"\"'>",
            "  AND category_id = #{categoryId}",
            "</if>",
            "<if test='keyword != null and keyword != \"\"'>",
            "  AND (LOWER(name) LIKE CONCAT('%', LOWER(#{keyword}), '%')",
            "       OR LOWER(description) LIKE CONCAT('%', LOWER(#{keyword}), '%'))",
            "</if>",
            "ORDER BY sales DESC, id",
            "</script>"
    })
    List<Product> listEnabled(@Param("categoryId") String categoryId, @Param("keyword") String keyword);

    /** 前台商品详情:只查上架商品,防止用户访问已下架商品的详情。 */
    @ResultMap("productMap")
    @Select("SELECT * FROM products WHERE id = #{productId} AND enabled = TRUE")
    Product findEnabledById(String productId);

    /** 后台编辑使用:无论上架下架都能查。 */
    @ResultMap("productMap")
    @Select("SELECT * FROM products WHERE id = #{productId}")
    Product findById(String productId);

    /** 后台商品列表(全量,已上架的排前面)。 */
    @ResultMap("productMap")
    @Select("SELECT * FROM products ORDER BY enabled DESC, id")
    List<Product> listAll();

    /** 后台首页统计:上架商品数量。 */
    @Select("SELECT COUNT(*) FROM products WHERE enabled = TRUE")
    int countEnabled();

    /** 删除分类前的安全检查:该分类下还有多少商品。 */
    @Select("SELECT COUNT(*) FROM products WHERE category_id = #{categoryId}")
    int countByCategory(String categoryId);

    /** 后台新增商品。tags List<String> 通过 typeHandler 自动转字符串。 */
    @Insert({
            "INSERT INTO products (id, category_id, name, description, image, price, sales, tags, enabled)",
            "VALUES (#{id}, #{categoryId}, #{name}, #{description}, #{image}, #{price}, #{sales},",
            "#{tags,typeHandler=com.unmanned.ordering.config.StringListTypeHandler}, #{enabled})"
    })
    int insert(Product product);

    /** 后台修改商品(整体覆盖)。 */
    @Update({
            "UPDATE products",
            "SET category_id = #{categoryId}, name = #{name}, description = #{description}, image = #{image},",
            "    price = #{price}, sales = #{sales},",
            "    tags = #{tags,typeHandler=com.unmanned.ordering.config.StringListTypeHandler}, enabled = #{enabled}",
            "WHERE id = #{id}"
    })
    int update(Product product);

    /** 软删除商品:enabled 置 false。保留历史订单引用的商品信息。 */
    @Update("UPDATE products SET enabled = FALSE WHERE id = #{productId}")
    int disable(String productId);

    /** 下单成功后增加商品销量。 */
    @Update("UPDATE products SET sales = sales + #{quantity} WHERE id = #{productId}")
    int increaseSales(@Param("productId") String productId, @Param("quantity") int quantity);

    /**
     * 取消订单时扣回销量。
     * CASE WHEN 是为了防止销量被扣成负数(理论上不该发生,但防御性写法更稳)。
     */
    @Update("UPDATE products SET sales = CASE WHEN sales > #{quantity} THEN sales - #{quantity} ELSE 0 END WHERE id = #{productId}")
    int decreaseSales(@Param("productId") String productId, @Param("quantity") int quantity);
}
