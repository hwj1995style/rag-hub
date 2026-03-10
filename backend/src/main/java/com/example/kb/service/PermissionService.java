package com.example.kb.service;

import com.example.kb.dto.request.PermissionBindRequest;
import java.util.Map;

public interface PermissionService {
    Map<String, Object> bind(PermissionBindRequest request);
}
