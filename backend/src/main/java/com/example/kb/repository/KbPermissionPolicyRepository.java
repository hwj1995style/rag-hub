package com.example.kb.repository;

import com.example.kb.entity.KbPermissionPolicy;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KbPermissionPolicyRepository extends JpaRepository<KbPermissionPolicy, UUID> {
    List<KbPermissionPolicy> findByResourceTypeAndResourceId(String resourceType, UUID resourceId);
    void deleteByResourceTypeAndResourceId(String resourceType, UUID resourceId);
}
