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

    List<KbPermissionPolicy> findByResourceTypeAndResourceIdOrderByCreatedAtDesc(String resourceType, UUID resourceId);

    @Query("""
            select policy from KbPermissionPolicy policy
            where (:resourceType is null or policy.resourceType = :resourceType)
              and (:resourceId is null or policy.resourceId = :resourceId)
              and (:subjectType is null or policy.subjectType = :subjectType)
              and (:subjectValue is null or policy.subjectValue = :subjectValue)
              and (:effect is null or policy.effect = :effect)
            order by policy.createdAt desc
            """)
    List<KbPermissionPolicy> searchPolicies(
            @Param("resourceType") String resourceType,
            @Param("resourceId") UUID resourceId,
            @Param("subjectType") String subjectType,
            @Param("subjectValue") String subjectValue,
            @Param("effect") String effect
    );

    @Modifying
    @Query("delete from KbPermissionPolicy policy where policy.resourceType = :resourceType and policy.resourceId = :resourceId")
    void deleteByResourceTypeAndResourceId(@Param("resourceType") String resourceType, @Param("resourceId") UUID resourceId);
}
