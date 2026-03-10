package com.example.kb.dto.response;

import java.util.List;

public record QaResponse(
        String answer,
        Double confidence,
        List<CitationResponse> citations,
        Integer retrievedCount,
        Integer usedChunkCount,
        String sessionId
) {
}
