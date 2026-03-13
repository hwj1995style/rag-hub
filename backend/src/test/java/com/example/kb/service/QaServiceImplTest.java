package com.example.kb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.kb.dto.request.QaRequest;
import com.example.kb.dto.response.QaResponse;
import com.example.kb.dto.response.SearchItemResponse;
import com.example.kb.llm.LlmClient;
import com.example.kb.llm.LlmGenerationRequest;
import com.example.kb.llm.LlmGenerationResponse;
import com.example.kb.qa.ContextAssembler;
import com.example.kb.qa.QaContext;
import com.example.kb.repository.KbQueryLogRepository;
import com.example.kb.rewrite.QueryRewriteResult;
import com.example.kb.rewrite.QueryRewriteService;
import com.example.kb.service.impl.QaServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QaServiceImplTest {

    @Mock
    private SearchService searchService;
    @Mock
    private KbQueryLogRepository queryLogRepository;
    @Mock
    private ContextAssembler contextAssembler;
    @Mock
    private LlmClient llmClient;
    @Mock
    private QueryRewriteService queryRewriteService;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private DocumentAccessService documentAccessService;

    @InjectMocks
    private QaServiceImpl qaService;

    @BeforeEach
    void setUp() {
        when(documentAccessService.filterAccessibleDocumentIds(anySet()))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void shouldAssembleContextCallLlmAndPersistQueryArtifacts() throws Exception {
        QaRequest request = new QaRequest("What materials are required for credit approval?", 5, true, null, "sess-001");
        List<SearchItemResponse> hits = List.of(
                new SearchItemResponse("chunk-1", "11111111-1111-1111-1111-111111111111", "Customer Credit Policy", "3.2 Required Materials", "p12", 0.92, "business license and financial statements")
        );
        QaContext context = QaContext.fromSearchResults("credit approval materials checklist", hits, 3);

        when(queryRewriteService.rewrite(request.query()))
                .thenReturn(new QueryRewriteResult(request.query(), "credit approval materials checklist"));
        when(searchService.search(any())).thenReturn(hits);
        when(contextAssembler.assemble("credit approval materials checklist", hits)).thenReturn(context);
        when(llmClient.generate(any(LlmGenerationRequest.class))).thenReturn(new LlmGenerationResponse("LLM answer"));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");

        QaResponse response = qaService.answer(request);

        assertEquals("LLM answer", response.answer());
        assertEquals(1, response.citations().size());
        assertEquals("Customer Credit Policy", response.citations().get(0).documentTitle());
        assertTrue(response.confidence() > 0.1);
        verify(queryRewriteService).rewrite(request.query());
        verify(queryLogRepository).save(any());
        verify(objectMapper, times(2)).writeValueAsString(any());
        verify(llmClient).generate(any(LlmGenerationRequest.class));
    }
}