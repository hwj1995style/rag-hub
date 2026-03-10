package com.example.kb.llm.impl;

import com.example.kb.config.KbProperties;
import com.example.kb.exception.LlmGatewayException;
import com.example.kb.llm.LlmClient;
import com.example.kb.llm.LlmGenerationRequest;
import com.example.kb.llm.LlmGenerationResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Primary
@Component
public class HttpOpenAiCompatibleLlmClient implements LlmClient {

    private final KbProperties kbProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Autowired
    public HttpOpenAiCompatibleLlmClient(KbProperties kbProperties, ObjectMapper objectMapper) {
        this(
                kbProperties,
                objectMapper,
                HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(kbProperties.getLlm().getTimeoutSeconds()))
                        .build()
        );
    }

    HttpOpenAiCompatibleLlmClient(KbProperties kbProperties, ObjectMapper objectMapper, HttpClient httpClient) {
        this.kbProperties = kbProperties;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    @Override
    public LlmGenerationResponse generate(LlmGenerationRequest request) {
        if (!kbProperties.getLlm().isEnabled()) {
            return fallback(request);
        }
        try {
            String endpoint = kbProperties.getLlm().getBaseUrl().replaceAll("/$", "") + kbProperties.getLlm().getChatPath();
            Map<String, Object> payload = Map.of(
                    "model", kbProperties.getLlm().getModel(),
                    "temperature", kbProperties.getLlm().getTemperature(),
                    "stream", false,
                    "messages", List.of(
                            Map.of("role", "system", "content", kbProperties.getLlm().getSystemPrompt()),
                            Map.of("role", "user", "content", buildPrompt(request))
                    )
            );
            HttpResponse<String> response = httpClient.send(buildRequest(endpoint, payload), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 300) {
                return handleErrorResponse(request, response);
            }
            JsonNode root = objectMapper.readTree(response.body());
            String content = readJsonPath(root, kbProperties.getLlm().getContentPath());
            if (content == null || content.isBlank()) {
                return handleFailure(request, new LlmGatewayException("KB-30007", "llm gateway returned empty content", HttpStatus.BAD_GATEWAY));
            }
            return new LlmGenerationResponse(content.trim());
        } catch (IOException ex) {
            return handleFailure(request, new LlmGatewayException("KB-30007", "llm gateway io error: " + ex.getMessage(), HttpStatus.BAD_GATEWAY));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return handleFailure(request, new LlmGatewayException("KB-30006", "llm gateway interrupted or timed out", HttpStatus.GATEWAY_TIMEOUT));
        }
    }

    private HttpRequest buildRequest(String endpoint, Map<String, Object> payload) throws IOException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(kbProperties.getLlm().getTimeoutSeconds()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload), StandardCharsets.UTF_8));
        applyAuthHeader(builder);
        applyOptionalHeader(builder, kbProperties.getLlm().getOrganizationHeaderName(), kbProperties.getLlm().getOrganizationHeaderValue());
        applyOptionalHeader(builder, kbProperties.getLlm().getWorkspaceHeaderName(), kbProperties.getLlm().getWorkspaceHeaderValue());
        kbProperties.getLlm().getExtraHeaders().forEach((name, value) -> applyOptionalHeader(builder, name, value));
        return builder.build();
    }

    private void applyAuthHeader(HttpRequest.Builder builder) {
        String headerName = kbProperties.getLlm().getAuthHeaderName();
        String apiKey = kbProperties.getLlm().getApiKey();
        if (headerName == null || headerName.isBlank() || apiKey == null || apiKey.isBlank()) {
            return;
        }
        String prefix = kbProperties.getLlm().getAuthHeaderPrefix() == null ? "" : kbProperties.getLlm().getAuthHeaderPrefix();
        builder.header(headerName, prefix + apiKey);
    }

    private void applyOptionalHeader(HttpRequest.Builder builder, String name, String value) {
        if (name == null || name.isBlank() || value == null || value.isBlank()) {
            return;
        }
        builder.header(name, value);
    }

    private LlmGenerationResponse handleErrorResponse(LlmGenerationRequest request, HttpResponse<String> response) {
        HttpStatus status = HttpStatus.resolve(response.statusCode());
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }
        String code = mapGatewayErrorCode(status);
        String message = extractGatewayMessage(response.body(), status);
        return handleFailure(request, new LlmGatewayException(code, message, status));
    }

    private LlmGenerationResponse handleFailure(LlmGenerationRequest request, LlmGatewayException exception) {
        if (kbProperties.getLlm().isFailOpen()) {
            return fallback(request);
        }
        throw exception;
    }

    private String extractGatewayMessage(String responseBody, HttpStatus status) {
        if (responseBody == null || responseBody.isBlank()) {
            return "llm gateway returned status " + status.value();
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String gatewayCode = readJsonPath(root, kbProperties.getLlm().getErrorCodePath());
            String gatewayMessage = readJsonPath(root, kbProperties.getLlm().getErrorMessagePath());
            if (gatewayMessage != null && !gatewayMessage.isBlank()) {
                return gatewayCode == null || gatewayCode.isBlank()
                        ? gatewayMessage
                        : gatewayCode + ": " + gatewayMessage;
            }
        } catch (IOException ignored) {
        }
        return "llm gateway returned status " + status.value();
    }

    private String mapGatewayErrorCode(HttpStatus status) {
        return switch (status) {
            case UNAUTHORIZED, FORBIDDEN -> "KB-10001";
            case TOO_MANY_REQUESTS -> "KB-30008";
            case GATEWAY_TIMEOUT, REQUEST_TIMEOUT -> "KB-30006";
            default -> "KB-30007";
        };
    }

    private String readJsonPath(JsonNode root, String pathExpression) {
        if (root == null || pathExpression == null || pathExpression.isBlank()) {
            return "";
        }
        JsonNode current = root;
        for (String segment : pathExpression.split("\\.")) {
            if (current == null || current.isMissingNode() || current.isNull()) {
                return "";
            }
            String fieldName = segment;
            Integer index = null;
            if (segment.contains("[") && segment.endsWith("]")) {
                int start = segment.indexOf('[');
                fieldName = segment.substring(0, start);
                index = Integer.parseInt(segment.substring(start + 1, segment.length() - 1));
            }
            if (!fieldName.isBlank()) {
                current = current.path(fieldName);
            }
            if (index != null) {
                current = current.path(index);
            }
        }
        return current == null || current.isMissingNode() || current.isNull() ? "" : current.asText("");
    }

    private String buildPrompt(LlmGenerationRequest request) {
        return "问题：\n" + request.userQuestion() + "\n\n上下文：\n" + request.context() + "\n\n要求：\n- "
                + String.join("\n- ", request.instructions());
    }

    private LlmGenerationResponse fallback(LlmGenerationRequest request) {
        String answer = request.context() == null || request.context().isBlank()
                ? "知识库未检索到足够证据，暂时无法回答。"
                : "已基于当前检索上下文生成候选答案。请结合引用内容核验：\n" + request.context();
        return new LlmGenerationResponse(answer);
    }
}