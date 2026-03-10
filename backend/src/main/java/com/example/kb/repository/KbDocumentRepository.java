package com.example.kb.repository;

import com.example.kb.entity.KbDocument;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface KbDocumentRepository extends JpaRepository<KbDocument, UUID>, JpaSpecificationExecutor<KbDocument> {
}
