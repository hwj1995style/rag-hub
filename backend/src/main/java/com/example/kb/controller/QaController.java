package com.example.kb.controller;

import com.example.kb.common.ApiResponse;
import com.example.kb.dto.request.QaRequest;
import com.example.kb.service.QaService;
import com.example.kb.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class QaController {

    private final QaService qaService;
    private final TaskService taskService;

    public QaController(QaService qaService, TaskService taskService) {
        this.qaService = qaService;
        this.taskService = taskService;
    }

    @PostMapping("/api/qa/query")
    public ApiResponse<Object> query(@Valid @RequestBody QaRequest request) {
        return ApiResponse.success(qaService.answer(request));
    }

    @GetMapping("/api/query-logs")
    public ApiResponse<Object> listQueryLogs(@RequestParam(required = false) String sessionId,
                                             @RequestParam(required = false) String queryText,
                                             @RequestParam(required = false) Integer pageNo,
                                             @RequestParam(required = false) Integer pageSize) {
        return ApiResponse.success(taskService.listQueryLogs(sessionId, queryText, pageNo, pageSize));
    }

    @GetMapping("/api/query-logs/{logId}")
    public ApiResponse<Object> getQueryLog(@PathVariable String logId) {
        return ApiResponse.success(taskService.getQueryLog(logId));
    }
}
