package com.example.kb.dto.response;

public record TaskResponse(
        String taskId,
        String taskType,
        String sourceUri,
        String documentId,
        String versionId,
        String status,
        String step,
        Integer retryCount,
        String errorMessage,
        String createdAt,
        String startedAt,
        String finishedAt
) {
}