package com.example.kb.service.impl;

import com.example.kb.dto.request.QaRequest;
import com.example.kb.dto.request.SearchRequest;
import com.example.kb.dto.response.QaResponse;
import com.example.kb.dto.response.SearchItemResponse;
import com.example.kb.entity.KbQueryLog;
import com.example.kb.llm.LlmClient;
import com.example.kb.llm.LlmGenerationRequest;
import com.example.kb.qa.ContextAssembler;
import com.example.kb.qa.QaContext;
import com.example.kb.repository.KbQueryLogRepository;
import com.example.kb.rewrite.QueryRewriteResult;
import com.example.kb.rewrite.QueryRewriteService;
import com.example.kb.service.DocumentAccessService;
import com.example.kb.service.QaService;
import com.example.kb.service.SearchService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QaServiceImpl implements QaService {

    private final SearchService searchService;
    private final KbQueryLogRepository queryLogRepository;
    private final ContextAssembler contextAssembler;
    private final LlmClient llmClient;
    private final QueryRewriteService queryRewriteService;
    private final ObjectMapper objectMapper;
    private final DocumentAccessService documentAccessService;

    public QaServiceImpl(SearchService searchService,
                         KbQueryLogRepository queryLogRepository,
                         ContextAssembler contextAssembler,
                         LlmClient llmClient,
                         QueryRewriteService queryRewriteService,
                         ObjectMapper objectMapper,
                         DocumentAccessService documentAccessService) {
        this.searchService = searchService;
        this.queryLogRepository = queryLogRepository;
        this.contextAssembler = contextAssembler;
        this.llmClient = llmClient;
        this.queryRewriteService = queryRewriteService;
        this.objectMapper = objectMapper;
        this.documentAccessService = documentAccessService;
    }

    @Override
    @Transactional
    public QaResponse answer(QaRequest request) {
        long start = System.currentTimeMillis();
        QueryRewriteResult rewrite = queryRewriteService.rewrite(request.query());
        List<SearchItemResponse> hits = filterAccessibleHits(
                searchService.search(new SearchRequest(rewrite.rewrittenQuery(), request.topK(), request.filters()))
        );

        QaResponse response;
        if (hits.isEmpty()) {
            response = new QaResponse(
                    "No sufficient evidence was found in the knowledge base to answer this question.",
                    0.0,
                    List.of(),
                    0,
                    0,
                    request.sessionId()
            );
        } else {
            QaContext context = contextAssembler.assemble(rewrite.rewrittenQuery(), hits);
            String answer = llmClient.generate(new LlmGenerationRequest(
                    rewrite.rewrittenQuery(),
                    context.assembledContext(),
                    List.of(
                            "Answer only from the provided context.",
                            "Prefer concise factual conclusions.",
                            "Keep important scope limits and conditions.",
                            "State clearly when the evidence is insufficient."
                    )
            )).answer();
            response = new QaResponse(
                    answer,
                    confidence(hits),
                    context.citations(),
                    hits.size(),
                    context.usedChunkCount(),
                    request.sessionId()
            );
        }
        saveQueryLog(request, rewrite, hits, response, (int) (System.currentTimeMillis() - start));
        return response;
    }

    private List<SearchItemResponse> filterAccessibleHits(List<SearchItemResponse> hits) {
        Set<UUID> documentIds = hits.stream()
                .map(SearchItemResponse::documentId)
                .map(UUID::fromString)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        Set<UUID> accessibleIds = documentAccessService.filterAccessibleDocumentIds(documentIds);
        return hits.stream()
                .filter(hit -> accessibleIds.contains(UUID.fromString(hit.documentId())))
                .toList();
    }

    private double confidence(List<SearchItemResponse> hits) {
        return Math.max(0.1, Math.min(0.95, hits.stream().limit(3).mapToDouble(SearchItemResponse::score).average().orElse(0.5)));
    }

    private void saveQueryLog(QaRequest request, QueryRewriteResult rewrite, List<SearchItemResponse> hits, QaResponse response, int latencyMs) {
        KbQueryLog log = new KbQueryLog();
        log.setUserId("system");
        log.setSessionId(request.sessionId());
        log.setQueryText(request.query());
        log.setRewrittenQuery(rewrite.rewrittenQuery());
        log.setAnswerText(response.answer());
        log.setRetrievedChunkIdsJson(toJson(hits.stream().map(SearchItemResponse::chunkId).toList()));
        log.setCitationsJson(toJson(response.citations()));
        log.setLatencyMs(latencyMs);
        log.setTraceId(UUID.randomUUID().toString());
        queryLogRepository.save(log);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return "[]";
        }
    }
}