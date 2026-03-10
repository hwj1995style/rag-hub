package com.example.kb.search.impl;

import com.example.kb.config.KbProperties;
import com.example.kb.dto.response.SearchItemResponse;
import com.example.kb.entity.KbDocument;
import com.example.kb.repository.KbDocumentRepository;
import com.example.kb.search.LexicalSearchClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ElasticsearchLexicalSearchClient implements LexicalSearchClient {

    private final KbProperties kbProperties;
    private final KbDocumentRepository documentRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public ElasticsearchLexicalSearchClient(KbProperties kbProperties,
                                            KbDocumentRepository documentRepository,
                                            ObjectMapper objectMapper) {
        this.kbProperties = kbProperties;
        this.documentRepository = documentRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(kbProperties.getSearch().getTimeoutSeconds()))
                .build();
    }

    @Override
    public List<SearchItemResponse> search(String query, int limit) {
        if (!kbProperties.getSearch().isEnabled() || kbProperties.getSearch().getEsUris().length == 0) {
            return List.of();
        }
        try {
            String endpoint = kbProperties.getSearch().getEsUris()[0].replaceAll("/$", "");
            String body = objectMapper.writeValueAsString(Map.of(
                    "size", Math.min(limit, kbProperties.getSearch().getLexicalTopK()),
                    "query", Map.of(
                            "multi_match", Map.of(
                                    "query", query,
                                    "fields", List.of("content_text^2", "content_summary", "title_path")
                            )
                    )
            ));
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint + "/" + kbProperties.getSearch().getIndexName() + "/_search"))
                    .timeout(Duration.ofSeconds(kbProperties.getSearch().getTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 300) {
                throw new IllegalStateException("es search failed with status=" + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode hits = root.path("hits").path("hits");
            List<SearchItemResponse> items = new ArrayList<>();
            for (JsonNode hit : hits) {
                JsonNode source = hit.path("_source");
                String documentId = source.path("document_id").asText();
                items.add(new SearchItemResponse(
                        source.path("chunk_id").asText(),
                        documentId,
                        findDocumentTitle(documentId),
                        source.path("title_path").asText(""),
                        source.path("locator").asText(""),
                        hit.path("_score").asDouble(0.0),
                        snippet(source.path("content_summary").asText(""), source.path("content_text").asText(""))
                ));
            }
            return items;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("es search interrupted", ex);
        } catch (IOException ex) {
            throw new IllegalStateException("es search failed", ex);
        }
    }

    private String findDocumentTitle(String documentId) {
        try {
            return documentRepository.findById(UUID.fromString(documentId)).map(KbDocument::getTitle).orElse("");
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
}
