package com.unmanned.ordering.exception;

import com.unmanned.ordering.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 处理我们自己主动抛出的业务异常。
    // 例如：请先登录、商品不存在、购物车为空、优惠券未达门槛。
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

    // 处理 @Valid 参数校验失败。
    // 例如：新增商品时没传商品名称，或者数量小于 1。
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleValidationException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("Request validation failed");
        return ApiResponse.fail(400, message);
    }

    // 兜底异常处理。
    // 正常业务尽量不要走到这里，如果走到这里，说明代码或环境有未预期错误。
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception exception) {
        return ApiResponse.fail(500, "Internal server error: " + exception.getMessage());
    }
}
