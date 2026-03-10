package com.example.kb.dto.response;

public record SearchItemResponse(
        String chunkId,
        String documentId,
        String documentTitle,
        String titlePath,
        String locator,
        Double score,
        String snippet
) {
}
