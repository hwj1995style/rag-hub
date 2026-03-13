package com.example.kb.dto.response;

import java.util.List;

public record PermissionPolicyListResponse(
        String resourceType,
        String resourceId,
        List<PermissionPolicyResponse> items
) {
}