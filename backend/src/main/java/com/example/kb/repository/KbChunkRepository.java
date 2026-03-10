package com.example.kb.repository;

import com.example.kb.entity.KbChunk;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KbChunkRepository extends JpaRepository<KbChunk, UUID> {
    List<KbChunk> findByDocumentId(UUID documentId);
    List<KbChunk> findByDocumentIdAndVersionId(UUID documentId, UUID versionId);
}
