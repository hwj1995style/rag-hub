package com.example.kb.common;

import java.util.UUID;

public record ApiResponse<T>(String code, String message, String traceId, T data) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("KB-00000", "success", UUID.randomUUID().toString(), data);
    }

    public static <T> ApiResponse<T> failure(String code, String message) {
        return new ApiResponse<>(code, message, UUID.randomUUID().toString(), null);
    }
}
