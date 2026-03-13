package com.example.kb.service;

import com.example.kb.dto.request.PermissionBindRequest;
import com.example.kb.dto.response.PermissionDeleteResponse;
import com.example.kb.dto.response.PermissionPolicyListResponse;
import java.util.Map;

public interface PermissionService {
    Map<String, Object> bind(PermissionBindRequest request);
    PermissionPolicyListResponse listPolicies(
            String resourceType,
            String resourceId,
            String subjectType,
            String subjectValue,
            String effect
    );
    PermissionDeleteResponse deletePolicy(String policyId);
}
