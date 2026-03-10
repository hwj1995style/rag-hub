package com.example.kb.dto.request;

import java.util.List;

public record PermissionBindRequest(
        String resourceType,
        String resourceId,
        List<PermissionPolicyRequest> policies
) {
}
