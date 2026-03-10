package com.example.kb.llm.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.kb.config.KbProperties;
import com.example.kb.exception.LlmGatewayException;
import com.example.kb.llm.LlmGenerationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class HttpOpenAiCompatibleLlmClientTest {

    @Mock
    private HttpClient httpClient;
    @Mock
    private HttpResponse<String> httpResponse;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private KbProperties kbProperties;
    private LlmGenerationRequest request;

    @BeforeEach
    void setUp() {
        kbProperties = new KbProperties();
        kbProperties.getLlm().setEnabled(true);
        kbProperties.getLlm().setFailOpen(false);
        kbProperties.getLlm().setBaseUrl("https://llm-gateway.example.com");
        kbProperties.getLlm().setChatPath("/v1/chat/completions");
        kbProperties.getLlm().setApiKey("secret-token");
        request = new LlmGenerationRequest(
                "客户额度审批需要哪些材料",
                "[片段1] 客户额度审批申请需提交营业执照、近两年财务报表、授信申请书。",
                List.of("仅基于上下文回答")
        );
    }

    @Test
    void shouldFallbackWhenFailOpenEnabledAndGatewayReturns401() throws Exception {
        kbProperties.getLlm().setFailOpen(true);
        when(httpResponse.statusCode()).thenReturn(401);
        when(httpResponse.body()).thenReturn("{\"error\":{\"code\":\"invalid_api_key\",\"message\":\"llm gateway authorization failed\"}}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        HttpOpenAiCompatibleLlmClient client = new HttpOpenAiCompatibleLlmClient(kbProperties, objectMapper, httpClient);
        String answer = client.generate(request).answer();

        assertTrue(answer.contains("已基于当前检索上下文生成候选答案"));
        assertTrue(answer.contains("营业执照"));
    }

    @Test
    void shouldThrowUnauthorizedWhenFailOpenDisabledAndGatewayReturns401() throws Exception {
        when(httpResponse.statusCode()).thenReturn(401);
        when(httpResponse.body()).thenReturn("{\"error\":{\"code\":\"invalid_api_key\",\"message\":\"llm gateway authorization failed\"}}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        HttpOpenAiCompatibleLlmClient client = new HttpOpenAiCompatibleLlmClient(kbProperties, objectMapper, httpClient);

        LlmGatewayException ex = assertThrows(LlmGatewayException.class, () -> client.generate(request));

        assertEquals("KB-10001", ex.getCode());
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getHttpStatus());
        assertEquals("invalid_api_key: llm gateway authorization failed", ex.getMessage());
    }

    @Test
    void shouldThrowRateLimitCodeWhenGatewayReturns429() throws Exception {
        when(httpResponse.statusCode()).thenReturn(429);
        when(httpResponse.body()).thenReturn("{\"error\":{\"code\":\"rate_limit_exceeded\",\"message\":\"too many requests\"}}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        HttpOpenAiCompatibleLlmClient client = new HttpOpenAiCompatibleLlmClient(kbProperties, objectMapper, httpClient);

        LlmGatewayException ex = assertThrows(LlmGatewayException.class, () -> client.generate(request));

        assertEquals("KB-30008", ex.getCode());
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getHttpStatus());
        assertEquals("rate_limit_exceeded: too many requests", ex.getMessage());
    }

    @Test
    void shouldParseCustomErrorPathsFromGatewayResponse() throws Exception {
        kbProperties.getLlm().setErrorCodePath("meta.err.code");
        kbProperties.getLlm().setErrorMessagePath("meta.err.msg");
        when(httpResponse.statusCode()).thenReturn(401);
        when(httpResponse.body()).thenReturn("{\"meta\":{\"err\":{\"code\":\"GW401\",\"msg\":\"custom denied\"}}}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        HttpOpenAiCompatibleLlmClient client = new HttpOpenAiCompatibleLlmClient(kbProperties, objectMapper, httpClient);

        LlmGatewayException ex = assertThrows(LlmGatewayException.class, () -> client.generate(request));

        assertEquals("KB-10001", ex.getCode());
        assertEquals("GW401: custom denied", ex.getMessage());
    }

    @Test
    void shouldSendConfiguredAuthAndExtraHeaders() throws Exception {
        kbProperties.getLlm().setAuthHeaderName("X-API-Key");
        kbProperties.getLlm().setAuthHeaderPrefix("Token ");
        kbProperties.getLlm().setOrganizationHeaderName("X-Organization-Id");
        kbProperties.getLlm().setOrganizationHeaderValue("org-001");
        kbProperties.getLlm().setWorkspaceHeaderName("X-Workspace-Id");
        kbProperties.getLlm().setWorkspaceHeaderValue("workspace-001");
        kbProperties.getLlm().setExtraHeaders(Map.of("X-App-Id", "kb-service", "X-Env", "test"));
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn("{\"choices\":[{\"message\":{\"content\":\"网关返回答案\"}}]}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        HttpOpenAiCompatibleLlmClient client = new HttpOpenAiCompatibleLlmClient(kbProperties, objectMapper, httpClient);
        String answer = client.generate(request).answer();

        ArgumentCaptor<HttpRequest> captor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient).send(captor.capture(), any(HttpResponse.BodyHandler.class));
        HttpRequest sentRequest = captor.getValue();

        assertEquals("网关返回答案", answer);
        assertEquals("Token secret-token", sentRequest.headers().firstValue("X-API-Key").orElseThrow());
        assertEquals("org-001", sentRequest.headers().firstValue("X-Organization-Id").orElseThrow());
        assertEquals("workspace-001", sentRequest.headers().firstValue("X-Workspace-Id").orElseThrow());
        assertEquals("kb-service", sentRequest.headers().firstValue("X-App-Id").orElseThrow());
        assertEquals("test", sentRequest.headers().firstValue("X-Env").orElseThrow());
    }
}
