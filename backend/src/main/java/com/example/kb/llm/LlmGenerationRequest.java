package com.example.kb.llm;

import java.util.List;

public record LlmGenerationRequest(String userQuestion, String context, List<String> instructions) {
}
