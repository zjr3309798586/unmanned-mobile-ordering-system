package com.unmanned.ordering.common;

// 统一接口返回格式。
// 前端收到的 JSON 都会长得像这样：
// {
//   "success": true,
//   "code": 200,
//   "message": "success",
//   "data": ...
// }
public class ApiResponse<T> {
    private boolean success;
    private int code;
    private String message;
    private T data;

    public ApiResponse() {
    }

    public ApiResponse(boolean success, int code, String message, T data) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
    }

    // 普通查询或修改成功时使用。
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, 200, "success", data);
    }

    // 新增数据成功时使用，例如加入购物车、创建订单、新增商品。
    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, 201, "created", data);
    }

    // 出现错误时使用，例如未登录、商品不存在、购物车为空。
    public static <T> ApiResponse<T> fail(int code, String message) {
        return new ApiResponse<>(false, code, message, null);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
