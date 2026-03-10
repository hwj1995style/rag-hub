package com.example.kb.service.impl;

import com.example.kb.dto.request.SearchRequest;
import com.example.kb.dto.response.SearchItemResponse;
import com.example.kb.entity.KbChunk;
import com.example.kb.entity.KbDocument;
import com.example.kb.repository.KbChunkRepository;
import com.example.kb.repository.KbDocumentRepository;
import com.example.kb.search.LexicalSearchClient;
import com.example.kb.search.VectorSearchClient;
import com.example.kb.service.SearchService;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SearchServiceImpl implements SearchService {

    private final KbChunkRepository chunkRepository;
    private final KbDocumentRepository documentRepository;
    private final LexicalSearchClient lexicalSearchClient;
    private final VectorSearchClient vectorSearchClient;

    public SearchServiceImpl(KbChunkRepository chunkRepository,
                             KbDocumentRepository documentRepository,
                             LexicalSearchClient lexicalSearchClient,
                             VectorSearchClient vectorSearchClient) {
        this.chunkRepository = chunkRepository;
        this.documentRepository = documentRepository;
        this.lexicalSearchClient = lexicalSearchClient;
        this.vectorSearchClient = vectorSearchClient;
    }

    @Override
    public List<SearchItemResponse> search(SearchRequest request) {
        String query = request.query().trim();
        int limit = request.topK() == null ? 10 : request.topK();

        Map<String, RankedHit> merged = new LinkedHashMap<>();
        tryMerge(merged, () -> lexicalSearchClient.search(query, limit));
        tryMerge(merged, () -> vectorSearchClient.search(query, limit));

        List<SearchItemResponse> items = merged.values().stream()
                .sorted(Comparator.comparing(RankedHit::score).reversed())
                .limit(limit)
                .map(RankedHit::item)
                .toList();

        if (!items.isEmpty()) {
            return items;
        }
        return fallbackSearch(query, limit);
    }

    private void tryMerge(Map<String, RankedHit> merged, SearchCall searchCall) {
        try {
            merge(merged, searchCall.execute());
        } catch (Exception ignored) {
            // degrade to other retrievers or fallback search
        }
    }

    private List<SearchItemResponse> fallbackSearch(String query, int limit) {
        return chunkRepository.findAll().stream()
                .filter(chunk -> chunk.getContentText() != null && chunk.getContentText().contains(query))
                .limit(limit)
                .map(this::toFallbackResponse)
                .toList();
    }

    private void merge(Map<String, RankedHit> merged, List<SearchItemResponse> items) {
        for (SearchItemResponse item : items) {
            merged.merge(item.chunkId(), new RankedHit(item, item.score()),
                    (oldValue, newValue) -> oldValue.score() >= newValue.score() ? oldValue : newValue);
        }
    }

    private SearchItemResponse toFallbackResponse(KbChunk chunk) {
        return new SearchItemResponse(
                chunk.getId().toString(),
                chunk.getDocumentId().toString(),
                findDocumentTitle(chunk.getDocumentId().toString()),
                Optional.ofNullable(chunk.getTitlePath()).orElse(""),
                Optional.ofNullable(chunk.getLocator()).orElse(""),
                0.5,
                snippet(chunk.getContentSummary(), chunk.getContentText())
        );
    }

    private String findDocumentTitle(String documentId) {
        try {
            UUID id = UUID.fromString(documentId);
            return documentRepository.findById(id).map(KbDocument::getTitle).orElse("");
        } catch (Exception ex) {
            return "";
        }
    }

    private String snippet(String summary, String text) {
        if (summary != null && !summary.isBlank()) {
            return summary;
        }
        if (text == null) {
            return "";
        }
        return text.length() > 160 ? text.substring(0, 160) : text;
    }

    private record RankedHit(SearchItemResponse item, double score) {
    }

    @FunctionalInterface
    private interface SearchCall {
        List<SearchItemResponse> execute();
    }
}
