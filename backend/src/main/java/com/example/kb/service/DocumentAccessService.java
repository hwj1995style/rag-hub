package com.example.kb.service;

import java.util.Set;
import java.util.UUID;

public interface DocumentAccessService {
    void assertCanAccessDocument(UUID documentId);
    Set<UUID> filterAccessibleDocumentIds(Set<UUID> documentIds);
}