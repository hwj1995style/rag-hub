package com.example.kb.service.impl;

import com.example.kb.dto.request.PermissionBindRequest;
import com.example.kb.dto.request.PermissionPolicyRequest;
import com.example.kb.entity.KbPermissionPolicy;
import com.example.kb.repository.KbPermissionPolicyRepository;
import com.example.kb.service.PermissionService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PermissionServiceImpl implements PermissionService {

    private final KbPermissionPolicyRepository permissionPolicyRepository;

    public PermissionServiceImpl(KbPermissionPolicyRepository permissionPolicyRepository) {
        this.permissionPolicyRepository = permissionPolicyRepository;
    }

    @Override
    @Transactional
    public Map<String, Object> bind(PermissionBindRequest request) {
        UUID resourceId = UUID.fromString(request.resourceId());
        permissionPolicyRepository.deleteByResourceTypeAndResourceId(request.resourceType(), resourceId);
        List<KbPermissionPolicy> policies = request.policies() == null ? List.of() : request.policies().stream()
                .map(item -> toEntity(request.resourceType(), resourceId, item))
                .toList();
        permissionPolicyRepository.saveAll(policies);
        return Map.of(
                "resource_id", request.resourceId(),
                "policy_count", policies.size(),
                "status", "success"
        );
    }

    private KbPermissionPolicy toEntity(String resourceType, UUID resourceId, PermissionPolicyRequest request) {
        KbPermissionPolicy entity = new KbPermissionPolicy();
        entity.setResourceType(resourceType);
        entity.setResourceId(resourceId);
        entity.setSubjectType(request.subjectType());
        entity.setSubjectValue(request.subjectValue());
        entity.setEffect(request.effect());
        return entity;
    }
}
