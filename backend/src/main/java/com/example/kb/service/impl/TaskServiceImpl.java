package com.example.kb.service.impl;

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
    public com.example.kb.dto.response.TaskResponse getTask(String taskId) {
        com.example.kb.entity.KbIngestTask task = taskRepository.findById(UUID.fromString(taskId))
                .orElseThrow(() -> new NotFoundException("task not found"));
        return new com.example.kb.dto.response.TaskResponse(
                task.getId().toString(),
                task.getTaskType(),
                task.getStatus(),
                task.getStep(),
                task.getRetryCount(),
                task.getErrorMessage(),
                task.getStartedAt() == null ? null : task.getStartedAt().toString(),
                task.getFinishedAt() == null ? null : task.getFinishedAt().toString()
        );
    }

    @Override
    public Map<String, Object> getQueryLog(String logId) {
        KbQueryLog log = queryLogRepository.findById(UUID.fromString(logId))
                .orElseThrow(() -> new NotFoundException("query log not found"));
        return Map.of(
                "log_id", log.getId().toString(),
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

    private Object parseJsonArray(String raw) {
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
}