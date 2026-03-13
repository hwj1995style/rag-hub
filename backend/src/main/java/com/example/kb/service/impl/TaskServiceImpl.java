package com.example.kb.service.impl;

import com.example.kb.dto.response.PageResponse;
import com.example.kb.dto.response.TaskResponse;
import com.example.kb.entity.KbIngestTask;
import com.example.kb.entity.KbQueryLog;
import com.example.kb.exception.NotFoundException;
import com.example.kb.repository.KbIngestTaskRepository;
import com.example.kb.repository.KbQueryLogRepository;
import com.example.kb.service.TaskService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class TaskServiceImpl implements TaskService {

    private final KbIngestTaskRepository taskRepository;
    private final KbQueryLogRepository queryLogRepository;
    private final ObjectMapper objectMapper;

    public TaskServiceImpl(KbIngestTaskRepository taskRepository, KbQueryLogRepository queryLogRepository, ObjectMapper objectMapper) {
        this.taskRepository = taskRepository;
        this.queryLogRepository = queryLogRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public PageResponse<TaskResponse> listTasks(String status, String taskType, String documentId, Integer pageNo, Integer pageSize) {
        int currentPage = pageNo == null ? 1 : pageNo;
        int currentSize = pageSize == null ? 20 : pageSize;
        Specification<KbIngestTask> spec = Specification.where(null);
        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (taskType != null && !taskType.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("taskType"), taskType));
        }
        if (documentId != null && !documentId.isBlank()) {
            UUID docId = UUID.fromString(documentId);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("documentId"), docId));
        }
        var page = taskRepository.findAll(
                spec,
                PageRequest.of(Math.max(currentPage - 1, 0), currentSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<TaskResponse> items = page.getContent().stream().map(this::toTaskResponse).toList();
        return new PageResponse<>(page.getTotalElements(), currentPage, currentSize, items);
    }

    @Override
    public TaskResponse getTask(String taskId) {
        KbIngestTask task = taskRepository.findById(UUID.fromString(taskId))
                .orElseThrow(() -> new NotFoundException("task not found"));
        return toTaskResponse(task);
    }

    @Override
    public PageResponse<Map<String, Object>> listQueryLogs(String sessionId, String queryText, Integer pageNo, Integer pageSize) {
        int currentPage = pageNo == null ? 1 : pageNo;
        int currentSize = pageSize == null ? 20 : pageSize;
        Specification<KbQueryLog> spec = Specification.where(null);
        if (sessionId != null && !sessionId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("sessionId"), sessionId));
        }
        if (queryText != null && !queryText.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.like(root.get("queryText"), "%" + queryText.trim() + "%"));
        }
        var page = queryLogRepository.findAll(
                spec,
                PageRequest.of(Math.max(currentPage - 1, 0), currentSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<Map<String, Object>> items = page.getContent().stream().map(this::toQueryLogListItem).toList();
        return new PageResponse<>(page.getTotalElements(), currentPage, currentSize, items);
    }

    @Override
    public Map<String, Object> getQueryLog(String logId) {
        KbQueryLog log = queryLogRepository.findById(UUID.fromString(logId))
                .orElseThrow(() -> new NotFoundException("query log not found"));
        return Map.of(
                "log_id", log.getId().toString(),
                "session_id", value(log.getSessionId()),
                "query_text", log.getQueryText(),
                "rewritten_query", value(log.getRewrittenQuery()),
                "answer_text", value(log.getAnswerText()),
                "latency_ms", log.getLatencyMs() == null ? 0 : log.getLatencyMs(),
                "trace_id", value(log.getTraceId()),
                "created_at", log.getCreatedAt() == null ? "" : log.getCreatedAt().toString(),
                "retrieved_chunk_ids", parseJsonArray(log.getRetrievedChunkIdsJson()),
                "citations", parseJsonArray(log.getCitationsJson())
        );
    }

    private Map<String, Object> toQueryLogListItem(KbQueryLog log) {
        List<Object> citations = parseJsonArray(log.getCitationsJson());
        List<Object> chunkIds = parseJsonArray(log.getRetrievedChunkIdsJson());
        return Map.of(
                "log_id", log.getId().toString(),
                "session_id", value(log.getSessionId()),
                "query_text", value(log.getQueryText()),
                "rewritten_query", value(log.getRewrittenQuery()),
                "trace_id", value(log.getTraceId()),
                "latency_ms", log.getLatencyMs() == null ? 0 : log.getLatencyMs(),
                "created_at", log.getCreatedAt() == null ? "" : log.getCreatedAt().toString(),
                "citation_count", citations.size(),
                "retrieved_chunk_count", chunkIds.size()
        );
    }

    private List<Object> parseJsonArray(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        try {
            JsonNode node = objectMapper.readTree(raw);
            if (node.isArray()) {
                return objectMapper.convertValue(node, new TypeReference<List<Object>>() {});
            }
            if (node.isTextual()) {
                String nested = node.asText();
                if (nested == null || nested.isBlank()) {
                    return List.of();
                }
                JsonNode nestedNode = objectMapper.readTree(nested);
                if (nestedNode.isArray()) {
                    return objectMapper.convertValue(nestedNode, new TypeReference<List<Object>>() {});
                }
            }
            return List.of();
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String value(String raw) {
        return raw == null ? "" : raw;
    }

    private TaskResponse toTaskResponse(KbIngestTask task) {
        return new TaskResponse(
                task.getId().toString(),
                task.getTaskType(),
                value(task.getSourceUri()),
                task.getDocumentId() == null ? "" : task.getDocumentId().toString(),
                task.getVersionId() == null ? "" : task.getVersionId().toString(),
                task.getStatus(),
                value(task.getStep()),
                task.getRetryCount(),
                task.getErrorMessage(),
                task.getCreatedAt() == null ? null : task.getCreatedAt().toString(),
                task.getUpdatedAt() == null ? null : task.getUpdatedAt().toString(),
                task.getStartedAt() == null ? null : task.getStartedAt().toString(),
                task.getFinishedAt() == null ? null : task.getFinishedAt().toString()
        );
    }
}
