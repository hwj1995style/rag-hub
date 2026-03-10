package com.example.kb.service;

import com.example.kb.dto.response.TaskResponse;
import java.util.Map;

public interface TaskService {
    TaskResponse getTask(String taskId);
    Map<String, Object> getQueryLog(String logId);
}
