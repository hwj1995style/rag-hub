package com.example.kb.repository;

import com.example.kb.entity.KbPermissionPolicy;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KbPermissionPolicyRepository extends JpaRepository<KbPermissionPolicy, UUID> {
    List<KbPermissionPolicy> findByResourceTypeAndResourceId(String resourceType, UUID resourceId);

    @Modifying
    @Query("delete from KbPermissionPolicy policy where policy.resourceType = :resourceType and policy.resourceId = :resourceId")
    void deleteByResourceTypeAndResourceId(@Param("resourceType") String resourceType, @Param("resourceId") UUID resourceId);
}