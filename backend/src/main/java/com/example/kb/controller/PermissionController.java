package com.example.kb.controller;

import com.example.kb.common.ApiResponse;
import com.example.kb.dto.request.PermissionBindRequest;
import com.example.kb.service.PermissionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ApiResponse<Object> list(
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String subjectType,
            @RequestParam(required = false) String subjectValue,
            @RequestParam(required = false) String effect
    ) {
        return ApiResponse.success(permissionService.listPolicies(resourceType, resourceId, subjectType, subjectValue, effect));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{policyId}")
    public ApiResponse<Object> delete(@PathVariable String policyId) {
        return ApiResponse.success(permissionService.deletePolicy(policyId));
    }
}
