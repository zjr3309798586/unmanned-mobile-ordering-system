package com.unmanned.ordering.common;

/**
 * 统一的接口返回结构。
 *
 * 所有接口最终返回的 JSON 都是这样:
 *   {
 *     "success": true,
 *     "code": 200,
 *     "message": "success",
 *     "data": ...   // 业务数据,任意类型
 *   }
 *
 * 失败时 success=false,code 是 401 / 404 / 400 等业务错误码,
 * message 是给用户看的错误文案,data 一般为 null。
 *
 * 用泛型 T 是为了让前端拿到的类型清晰(例如 ApiResponse<List<Product>>)。
 */
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

    /** 普通查询或修改成功 → 200。 */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, 200, "success", data);
    }

    /** 新增成功 → 201。例如加入购物车、创建订单、新增商品。 */
    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, 201, "created", data);
    }

    /** 业务失败时使用。code 由 BusinessException 传过来,通常 401/404/400。 */
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
