package com.example.kb.controller;

import com.example.kb.common.ApiResponse;
import com.example.kb.service.TaskService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ApiResponse<Object> listTasks(@RequestParam(required = false) String status,
                                         @RequestParam(required = false) String taskType,
                                         @RequestParam(required = false) String documentId,
                                         @RequestParam(required = false) String sourceKeyword,
                                         @RequestParam(required = false) Integer pageNo,
                                         @RequestParam(required = false) Integer pageSize) {
        return ApiResponse.success(taskService.listTasks(status, taskType, documentId, sourceKeyword, pageNo, pageSize));
    }

    @GetMapping("/{taskId}")
    public ApiResponse<Object> getTask(@PathVariable String taskId) {
        return ApiResponse.success(taskService.getTask(taskId));
    }
}
