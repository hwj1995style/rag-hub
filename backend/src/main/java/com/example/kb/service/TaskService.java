package com.example.kb.service;

import com.example.kb.dto.response.PageResponse;
import com.example.kb.dto.response.TaskResponse;
import java.util.Map;

public interface TaskService {
    PageResponse<TaskResponse> listTasks(String status, String taskType, String documentId, Integer pageNo, Integer pageSize);
    TaskResponse getTask(String taskId);
    Map<String, Object> getQueryLog(String logId);
}