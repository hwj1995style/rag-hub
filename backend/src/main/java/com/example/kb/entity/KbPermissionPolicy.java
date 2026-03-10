package com.example.kb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "kb_permission_policy")
public class KbPermissionPolicy {

    @Id
    private UUID id;
    @Column(nullable = false, length = 32)
    private String resourceType;
    @Column(nullable = false)
    private UUID resourceId;
    @Column(nullable = false, length = 32)
    private String subjectType;
    @Column(nullable = false, length = 128)
    private String subjectValue;
    @Column(nullable = false, length = 16)
    private String effect;
    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) { id = UUID.randomUUID(); }
        createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public UUID getResourceId() { return resourceId; }
    public void setResourceId(UUID resourceId) { this.resourceId = resourceId; }
    public String getSubjectType() { return subjectType; }
    public void setSubjectType(String subjectType) { this.subjectType = subjectType; }
    public String getSubjectValue() { return subjectValue; }
    public void setSubjectValue(String subjectValue) { this.subjectValue = subjectValue; }
    public String getEffect() { return effect; }
    public void setEffect(String effect) { this.effect = effect; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
