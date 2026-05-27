package com.unmanned.ordering.exception;

/**
 * 业务异常。
 *
 * 整个后端用这一个异常类表达所有"可控的业务错误"(用户输入不对、资源不存在、状态不允许等)。
 * Service / Controller 里随时可以 throw,然后由 GlobalExceptionHandler 统一捕获,
 * 转成对应的 HTTP 状态码 + ApiResponse.fail 返回前端。
 *
 * 约定 code 与 HTTP 状态码的映射:
 *   401 → 未登录 / token 失效
 *   404 → 资源不存在
 *   400 → 其他业务错误(参数不对、状态不允许、门槛不够 ...)
 *
 * 继承 RuntimeException 是为了不强制 try/catch,
 * Service 方法不用在签名里声明 throws,代码更清爽。
 */
public class BusinessException extends RuntimeException {
    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
