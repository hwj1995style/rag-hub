package com.example.kb.exception;

import org.springframework.http.HttpStatus;

public class LlmGatewayException extends BizException {

    private final HttpStatus httpStatus;

    public LlmGatewayException(String code, String message, HttpStatus httpStatus) {
        super(code, message);
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
