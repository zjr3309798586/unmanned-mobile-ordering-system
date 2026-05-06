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

// ProductMapper 负责操作 products 商品表。
// 这里使用 MyBatis 注解写 SQL，不需要单独的 XML 文件。
@Mapper
public interface ProductMapper {
    // tags 在数据库里是字符串，Java 里是 List<String>，这里指定类型转换器。
    @Results(id = "productMap", value = {
            @Result(property = "tags", column = "tags", typeHandler = StringListTypeHandler.class)
    })
    // 前台点餐页查询商品：只查 enabled = TRUE 的上架商品，并支持分类和关键词筛选。
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

    // 前台商品详情页使用：只能查上架商品，防止用户打开已下架商品。
    @ResultMap("productMap")
    @Select("SELECT * FROM products WHERE id = #{productId} AND enabled = TRUE")
    Product findEnabledById(String productId);

    // 后台管理使用：不管上架下架都可以查。
    @ResultMap("productMap")
    @Select("SELECT * FROM products WHERE id = #{productId}")
    Product findById(String productId);

    // 后台商品列表使用：所有商品都展示，已上架排前面。
    @ResultMap("productMap")
    @Select("SELECT * FROM products ORDER BY enabled DESC, id")
    List<Product> listAll();

    // 后台首页统计上架商品数量。
    @Select("SELECT COUNT(*) FROM products WHERE enabled = TRUE")
    int countEnabled();

    // 删除分类前先检查该分类下是否还有商品。
    @Select("SELECT COUNT(*) FROM products WHERE category_id = #{categoryId}")
    int countByCategory(String categoryId);

    // 后台新增商品。
    @Insert({
            "INSERT INTO products (id, category_id, name, description, image, price, sales, tags, enabled)",
            "VALUES (#{id}, #{categoryId}, #{name}, #{description}, #{image}, #{price}, #{sales},",
            "#{tags,typeHandler=com.unmanned.ordering.config.StringListTypeHandler}, #{enabled})"
    })
    int insert(Product product);

    // 后台编辑商品。
    @Update({
            "UPDATE products",
            "SET category_id = #{categoryId}, name = #{name}, description = #{description}, image = #{image},",
            "    price = #{price}, sales = #{sales},",
            "    tags = #{tags,typeHandler=com.unmanned.ordering.config.StringListTypeHandler}, enabled = #{enabled}",
            "WHERE id = #{id}"
    })
    int update(Product product);

    // 下架商品，保留历史数据。
    @Update("UPDATE products SET enabled = FALSE WHERE id = #{productId}")
    int disable(String productId);

    // 下单成功后增加销量。
    @Update("UPDATE products SET sales = sales + #{quantity} WHERE id = #{productId}")
    int increaseSales(@Param("productId") String productId, @Param("quantity") int quantity);

    // 取消订单时扣回销量，CASE WHEN 用来防止销量变成负数。
    @Update("UPDATE products SET sales = CASE WHEN sales > #{quantity} THEN sales - #{quantity} ELSE 0 END WHERE id = #{productId}")
    int decreaseSales(@Param("productId") String productId, @Param("quantity") int quantity);
}
