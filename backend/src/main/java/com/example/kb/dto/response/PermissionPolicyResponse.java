package com.example.kb.dto.response;

public record PermissionPolicyResponse(
        String policyId,
        String resourceType,
        String resourceId,
        String subjectType,
        String subjectValue,
        String effect,
        String createdAt
) {
}