package com.example.kb.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record SearchRequest(
        @NotBlank String query,
        @Min(1) @Max(20) Integer topK,
        Map<String, String> filters
) {
}
