package com.unmanned.ordering.exception;

import com.unmanned.ordering.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器。
 *
 * 把任何 Controller / Service 抛出的异常统一转成 ApiResponse 格式返回前端。
 * @RestControllerAdvice 让这个类对所有 @RestController 生效,不需要在每个
 * Controller 里手写 try/catch。
 *
 * 三层兜底:
 *   1. BusinessException                   业务错误 → 401/404/400
 *   2. MethodArgumentNotValidException     @Valid 校验失败 → 400
 *   3. Exception(兜底)                    其他未预期错误 → 500
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理我们自己抛出的业务异常,根据 code 映射 HTTP 状态码。
     *
     * 例:throw new BusinessException(401, "请先登录") → HTTP 401 + JSON 错误体。
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException exception) {
        HttpStatus status;
        if (exception.getCode() == 401) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (exception.getCode() == 404) {
            status = HttpStatus.NOT_FOUND;
        } else {
            status = HttpStatus.BAD_REQUEST;
        }
        return ResponseEntity.status(status).body(ApiResponse.fail(exception.getCode(), exception.getMessage()));
    }

    /**
     * 处理 @Valid 注解校验失败。
     *
     * 当请求体里某个字段不满足 @NotBlank / @NotNull / @Size 等注解,
     * Spring 会先抛 MethodArgumentNotValidException,在这里转成 400 + 友好信息。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleValidationException(MethodArgumentNotValidException exception) {
        // 只取第一个错误字段返回,避免一次给前端展示太多信息
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("Request validation failed");
        return ApiResponse.fail(400, message);
    }

    /**
     * 兜底异常处理。
     *
     * 走到这里说明代码有 bug 或环境出问题(NPE / 数据库连不上 / JSON 解析失败等)。
     * 正常业务流程不应触发,触发就要排查日志。
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception exception) {
        return ApiResponse.fail(500, "Internal server error: " + exception.getMessage());
    }
}
