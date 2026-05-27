package com.unmanned.ordering.config;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * MyBatis 类型转换器:数据库的 VARCHAR(逗号分隔)与 Java 的 List<String> 互转。
 *
 * 用途:
 *   products.tags                 例如 "新品,推荐"
 *   saving_card_plans.benefits    例如 "免运费,生日礼包,9 折券"
 *
 * 在 ProductMapper 和 StoreMapper 的 @Result / @Insert / @Update 上引用本类,
 * MyBatis 会自动调用:
 *   写入时(setNonNullParameter):List<String> → "a,b,c"
 *   读取时(getNullableResult):"a,b,c" → List<String>
 *
 * 这样 Java 代码里始终用 List<String>,SQL 层不用关心字符串拼接。
 */
@MappedTypes(List.class)
@MappedJdbcTypes(JdbcType.VARCHAR)
public class StringListTypeHandler extends BaseTypeHandler<List<String>> {
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<String> parameter, JdbcType jdbcType)
            throws SQLException {
        // List<String> → "a,b,c" 字符串
        ps.setString(i, String.join(",", parameter));
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return split(rs.getString(columnName));
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return split(rs.getString(columnIndex));
    }

    @Override
    public List<String> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return split(cs.getString(columnIndex));
    }

    /** "a,b,c" → ["a","b","c"],并过滤掉空白项,空字符串返回空 List。 */
    private List<String> split(String value) {
        if (value == null || value.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.toList());
    }
}
