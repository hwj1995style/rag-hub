package com.example.kb.llm.impl;

import com.example.kb.llm.LlmClient;
import com.example.kb.llm.LlmGenerationRequest;
import com.example.kb.llm.LlmGenerationResponse;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class RuleBasedLlmClient implements LlmClient {

    @Override
    public LlmGenerationResponse generate(LlmGenerationRequest request) {
        if (request.context() == null || request.context().isBlank()) {
            return new LlmGenerationResponse("知识库未检索到足够证据，暂时无法回答。");
        }
        String summary = Arrays.stream(request.context().split("\\n"))
                .filter(line -> !line.isBlank())
                .limit(3)
                .map(line -> line.replaceFirst("^\\[片段\\d+\\] ", ""))
                .collect(Collectors.joining("；"));
        return new LlmGenerationResponse("基于当前检索结果，和问题“" + request.userQuestion() + "”最相关的依据包括：" + summary + "。请以引用内容为准。");
    }
}
