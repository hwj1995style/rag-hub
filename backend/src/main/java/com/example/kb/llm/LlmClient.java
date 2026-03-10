package com.example.kb.llm;

public interface LlmClient {
    LlmGenerationResponse generate(LlmGenerationRequest request);
}
