package com.example.kb.dto.response;

public record TaskResponse(
        String taskId,
        String taskType,
        String status,
        String step,
        Integer retryCount,
        String errorMessage,
        String startedAt,
        String finishedAt
) {
}
