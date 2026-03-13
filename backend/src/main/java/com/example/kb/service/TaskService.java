package com.example.kb.service;

import com.example.kb.dto.response.PageResponse;
import com.example.kb.dto.response.TaskResponse;
import java.util.Map;

public interface TaskService {
    PageResponse<TaskResponse> listTasks(String status, String taskType, String documentId, String sourceKeyword, Integer pageNo, Integer pageSize);
    TaskResponse getTask(String taskId);
    PageResponse<Map<String, Object>> listQueryLogs(String sessionId, String queryText, Integer pageNo, Integer pageSize);
    Map<String, Object> getQueryLog(String logId);
}
