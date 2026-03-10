package com.example.kb.repository;

import com.example.kb.entity.KbDocumentVersion;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KbDocumentVersionRepository extends JpaRepository<KbDocumentVersion, UUID> {
    Optional<KbDocumentVersion> findByDocumentIdAndIsCurrentTrue(UUID documentId);
    List<KbDocumentVersion> findByDocumentId(UUID documentId);
}
