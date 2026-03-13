package com.example.kb.dto.response;

import java.util.List;

public record PermissionPolicyListResponse(
        String resourceType,
        String resourceId,
        String subjectType,
        String subjectValue,
        String effect,
        List<PermissionPolicyResponse> items
) {
}
