package com.example.kb.service;

import com.example.kb.dto.request.PermissionBindRequest;
import com.example.kb.dto.response.PermissionDeleteResponse;
import com.example.kb.dto.response.PermissionPolicyListResponse;
import java.util.Map;

public interface PermissionService {
    Map<String, Object> bind(PermissionBindRequest request);
    PermissionPolicyListResponse listPolicies(String resourceType, String resourceId);
    PermissionDeleteResponse deletePolicy(String policyId);
}