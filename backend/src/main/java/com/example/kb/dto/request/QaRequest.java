package com.example.kb.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record QaRequest(
        @NotBlank String query,
        @Min(1) @Max(20) Integer topK,
        Boolean returnCitations,
        Map<String, String> filters,
        String sessionId
) {
}
