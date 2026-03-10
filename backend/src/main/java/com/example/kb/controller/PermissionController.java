package com.example.kb.controller;

import com.example.kb.common.ApiResponse;
import com.example.kb.dto.request.PermissionBindRequest;
import com.example.kb.service.PermissionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bind")
    public ApiResponse<Object> bind(@RequestBody PermissionBindRequest request) {
        return ApiResponse.success(permissionService.bind(request));
    }
}
