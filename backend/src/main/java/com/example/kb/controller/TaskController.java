package com.example.kb.controller;

import com.example.kb.common.ApiResponse;
import com.example.kb.service.TaskService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/{taskId}")
    public ApiResponse<Object> getTask(@PathVariable String taskId) {
        return ApiResponse.success(taskService.getTask(taskId));
    }
}
