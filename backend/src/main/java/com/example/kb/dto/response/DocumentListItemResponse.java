package com.example.kb.dto.response;

public record DocumentListItemResponse(
        String documentId,
        String title,
        String bizDomain,
        String department,
        String status,
        String currentVersionId,
        String updatedAt
) {
}
