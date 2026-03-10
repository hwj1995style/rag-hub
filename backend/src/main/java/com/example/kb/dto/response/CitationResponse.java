package com.example.kb.dto.response;

public record CitationResponse(
        String documentId,
        String documentTitle,
        String titlePath,
        String locator,
        String snippet
) {
}
