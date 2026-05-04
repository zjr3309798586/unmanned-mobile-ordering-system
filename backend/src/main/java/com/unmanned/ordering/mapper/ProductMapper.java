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

@Mapper
public interface ProductMapper {
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

    @ResultMap("productMap")
    @Select("SELECT * FROM products WHERE id = #{productId} AND enabled = TRUE")
    Product findEnabledById(String productId);

    @ResultMap("productMap")
    @Select("SELECT * FROM products WHERE id = #{productId}")
    Product findById(String productId);

    @ResultMap("productMap")
    @Select("SELECT * FROM products ORDER BY enabled DESC, id")
    List<Product> listAll();

    @Select("SELECT COUNT(*) FROM products WHERE enabled = TRUE")
    int countEnabled();

    @Insert({
            "INSERT INTO products (id, category_id, name, description, image, price, sales, tags, enabled)",
            "VALUES (#{id}, #{categoryId}, #{name}, #{description}, #{image}, #{price}, #{sales},",
            "#{tags,typeHandler=com.unmanned.ordering.config.StringListTypeHandler}, #{enabled})"
    })
    int insert(Product product);

    @Update({
            "UPDATE products",
            "SET category_id = #{categoryId}, name = #{name}, description = #{description}, image = #{image},",
            "    price = #{price}, sales = #{sales},",
            "    tags = #{tags,typeHandler=com.unmanned.ordering.config.StringListTypeHandler}, enabled = #{enabled}",
            "WHERE id = #{id}"
    })
    int update(Product product);

    @Update("UPDATE products SET enabled = FALSE WHERE id = #{productId}")
    int disable(String productId);
}
