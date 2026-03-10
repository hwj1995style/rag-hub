package com.example.kb.search.impl;

import com.example.kb.config.KbProperties;
import com.example.kb.dto.response.SearchItemResponse;
import com.example.kb.entity.KbDocument;
import com.example.kb.repository.KbDocumentRepository;
import com.example.kb.search.VectorSearchClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class QdrantSearchClient implements VectorSearchClient {

    private final KbProperties kbProperties;
    private final KbDocumentRepository documentRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public QdrantSearchClient(KbProperties kbProperties,
                              KbDocumentRepository documentRepository,
                              ObjectMapper objectMapper) {
        this.kbProperties = kbProperties;
        this.documentRepository = documentRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(kbProperties.getVector().getTimeoutSeconds()))
                .build();
    }

    @Override
    public List<SearchItemResponse> search(String query, int limit) {
        if (!kbProperties.getVector().isEnabled()) {
            return List.of();
        }

        try {
            String endpoint = String.format(
                    Locale.ROOT,
                    "http://%s:%d/collections/%s/points/query",
                    kbProperties.getVector().getQdrantHost(),
                    kbProperties.getVector().getQdrantPort(),
                    kbProperties.getVector().getQdrantCollection()
            );
            String body = buildRequestBody(query, Math.min(limit, kbProperties.getVector().getVectorTopK()));
            HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(kbProperties.getVector().getTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Qdrant query failed with status " + response.statusCode());
            }
            return parseResponse(response.body());
        } catch (IOException | InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Qdrant query failed", ex);
        }
    }

    private String buildRequestBody(String query, int limit) throws IOException {
        JsonNode payload = objectMapper.createObjectNode()
                .set("query", objectMapper.valueToTree(embed(query, kbProperties.getVector().getEmbeddingDim())));
        ((com.fasterxml.jackson.databind.node.ObjectNode) payload).put("limit", limit);
        ((com.fasterxml.jackson.databind.node.ObjectNode) payload).put("with_payload", true);
        return objectMapper.writeValueAsString(payload);
    }

    private List<SearchItemResponse> parseResponse(String body) throws IOException {
        JsonNode root = objectMapper.readTree(body);
        JsonNode result = root.path("result");
        JsonNode points = result.path("points");
        if (points.isMissingNode() || !points.isArray()) {
            points = result;
        }
        if (!points.isArray()) {
            return List.of();
        }

        List<SearchItemResponse> items = new ArrayList<>();
        for (JsonNode point : points) {
            JsonNode payload = point.path("payload");
            String documentId = firstText(payload, "document_id", "documentId");
            String titlePath = firstText(payload, "title_path", "titlePath");
            String locator = firstText(payload, "locator");
            String summary = firstText(payload, "content_summary", "contentSummary");
            String text = firstText(payload, "content_text", "contentText");
            String chunkId = point.path("id").asText();
            double score = point.path("score").asDouble(0.0d);

            items.add(new SearchItemResponse(
                    chunkId,
                    documentId,
                    findDocumentTitle(documentId),
                    titlePath,
                    locator,
                    score,
                    snippet(summary, text)
            ));
        }
        return items;
    }

    private String firstText(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode value = node.path(fieldName);
            if (!value.isMissingNode() && !value.isNull()) {
                return value.asText("");
            }
        }
        return "";
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

    private List<Double> embed(String text, int dim) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            List<Double> vector = new ArrayList<>(dim);
            for (int i = 0; i < dim; i++) {
                int value = bytes[i % bytes.length] & 0xff;
                vector.add(value / 255.0d);
            }
            return vector;
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }
}