package com.example.kb.dto.request;

public record BatchImportRequest(
        String sourceType,
        String sourceUri,
        String bizDomain,
        String department,
        String securityLevel
) {
}
