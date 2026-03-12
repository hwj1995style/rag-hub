package com.example.kb.service.impl;

import com.example.kb.dto.request.ActivateVersionRequest;
import com.example.kb.dto.request.BatchImportRequest;
import com.example.kb.dto.request.ReparseRequest;
import com.example.kb.dto.response.ChunkItemResponse;
import com.example.kb.dto.response.DocumentListItemResponse;
import com.example.kb.dto.response.PageResponse;
import com.example.kb.dto.response.TaskResponse;
import com.example.kb.entity.KbChunk;
import com.example.kb.entity.KbDocument;
import com.example.kb.entity.KbDocumentVersion;
import com.example.kb.entity.KbIngestTask;
import com.example.kb.exception.NotFoundException;
import com.example.kb.repository.KbChunkRepository;
import com.example.kb.repository.KbDocumentRepository;
import com.example.kb.repository.KbDocumentVersionRepository;
import com.example.kb.repository.KbIngestTaskRepository;
import com.example.kb.service.DocumentService;
import com.example.kb.storage.DocumentStorageService;
import com.example.kb.storage.StoredFile;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentServiceImpl implements DocumentService {

    private final KbDocumentRepository documentRepository;
    private final KbDocumentVersionRepository versionRepository;
    private final KbIngestTaskRepository taskRepository;
    private final KbChunkRepository chunkRepository;
    private final DocumentStorageService storageService;

    public DocumentServiceImpl(KbDocumentRepository documentRepository,
                               KbDocumentVersionRepository versionRepository,
                               KbIngestTaskRepository taskRepository,
                               KbChunkRepository chunkRepository,
                               DocumentStorageService storageService) {
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.taskRepository = taskRepository;
        this.chunkRepository = chunkRepository;
        this.storageService = storageService;
    }

    @Override
    @Transactional
    public Object upload(MultipartFile file, String title, String bizDomain, String department, String securityLevel,
                         String sourceSystem, String owner, String permissionTags) {
        if (file == null || file.isEmpty() || file.getSize() <= 0) {
            throw new IllegalArgumentException("uploaded file must not be empty");
        }
        String fileName = file.getOriginalFilename() == null ? "unknown" : file.getOriginalFilename();
        StoredFile storedFile = storageService.store(file);
        KbDocument document = new KbDocument();
        document.setDocCode("DOC-" + System.currentTimeMillis());
        document.setTitle(title == null || title.isBlank() ? fileName : title);
        document.setSourceType(resolveSourceType(fileName));
        document.setSourceUri(storedFile.sourceUri());
        document.setSourceSystem(sourceSystem);
        document.setOwner(owner);
        document.setDepartment(department);
        document.setBizDomain(bizDomain);
        document.setSecurityLevel(securityLevel == null || securityLevel.isBlank() ? "internal" : securityLevel);
        document.setStatus("draft");
        documentRepository.save(document);

        KbDocumentVersion version = new KbDocumentVersion();
        version.setDocumentId(document.getId());
        version.setVersionNo("v1.0");
        version.setFileHash(UUID.randomUUID().toString().replace("-", ""));
        version.setFileName(storedFile.fileName());
        version.setFileSize(storedFile.fileSize());
        version.setStoragePath(storedFile.storagePath());
        version.setParseStatus("pending");
        version.setIndexStatus("pending");
        version.setIsCurrent(true);
        versionRepository.save(version);

        document.setCurrentVersionId(version.getId());
        document.setStatus("active");
        documentRepository.save(document);

        KbIngestTask task = new KbIngestTask();
        task.setTaskType("ingest");
        task.setSourceUri(version.getStoragePath());
        task.setDocumentId(document.getId());
        task.setVersionId(version.getId());
        task.setStatus("pending");
        task.setStep("queued");
        taskRepository.save(task);

        return Map.of(
                "document_id", document.getId().toString(),
                "version_id", version.getId().toString(),
                "task_id", task.getId().toString(),
                "status", task.getStatus()
        );
    }

    @Override
    public Object batchImport(BatchImportRequest request) {
        return Map.of(
                "batch_id", UUID.randomUUID().toString(),
                "task_count", 0,
                "accepted_count", 0,
                "source_uri", request.sourceUri()
        );
    }

    @Override
    @Transactional
    public TaskResponse reparse(String documentId, ReparseRequest request) {
        UUID docId = UUID.fromString(documentId);
        KbDocument document = documentRepository.findById(docId).orElseThrow(() -> new NotFoundException("document not found"));
        KbDocumentVersion version = versionRepository.findByDocumentIdAndIsCurrentTrue(docId)
                .orElseThrow(() -> new NotFoundException("current document version not found"));

        KbIngestTask task = new KbIngestTask();
        task.setTaskType("reparse");
        task.setSourceUri(version.getStoragePath());
        task.setDocumentId(document.getId());
        task.setVersionId(version.getId());
        task.setStatus("pending");
        task.setStep("queued");
        taskRepository.save(task);
        return toTaskResponse(task);
    }

    @Override
    public Object listDocuments(String keyword, String bizDomain, String department, String status, Integer pageNo, Integer pageSize) {
        int currentPage = pageNo == null ? 1 : pageNo;
        int currentSize = pageSize == null ? 20 : pageSize;
        Specification<KbDocument> spec = Specification.where((root, query, cb) -> cb.isFalse(root.get("isDeleted")));
        if (keyword != null && !keyword.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.like(root.get("title"), "%" + keyword + "%"));
        }
        if (bizDomain != null && !bizDomain.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("bizDomain"), bizDomain));
        }
        if (department != null && !department.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("department"), department));
        }
        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        var page = documentRepository.findAll(spec, PageRequest.of(Math.max(currentPage - 1, 0), currentSize));
        List<DocumentListItemResponse> items = page.getContent().stream().map(doc -> new DocumentListItemResponse(
                doc.getId().toString(),
                doc.getTitle(),
                nullToEmpty(doc.getBizDomain()),
                nullToEmpty(doc.getDepartment()),
                doc.getStatus(),
                doc.getCurrentVersionId() == null ? "" : doc.getCurrentVersionId().toString(),
                doc.getUpdatedAt() == null ? "" : doc.getUpdatedAt().toString()
        )).toList();
        return new PageResponse<>(page.getTotalElements(), currentPage, currentSize, items);
    }

    @Override
    public Object getDocumentDetail(String documentId) {
        UUID docId = UUID.fromString(documentId);
        KbDocument document = documentRepository.findById(docId).orElseThrow(() -> new NotFoundException("document not found"));
        KbDocumentVersion version = versionRepository.findByDocumentIdAndIsCurrentTrue(docId).orElse(null);
        return Map.of(
                "document_id", document.getId().toString(),
                "doc_code", document.getDocCode(),
                "title", document.getTitle(),
                "source_type", document.getSourceType(),
                "source_uri", nullToEmpty(document.getSourceUri()),
                "biz_domain", nullToEmpty(document.getBizDomain()),
                "department", nullToEmpty(document.getDepartment()),
                "security_level", document.getSecurityLevel(),
                "status", document.getStatus(),
                "current_version", version == null ? Map.of() : Map.of(
                        "version_id", version.getId().toString(),
                        "version_no", version.getVersionNo(),
                        "parse_status", version.getParseStatus(),
                        "index_status", version.getIndexStatus(),
                        "effective_from", version.getEffectiveFrom() == null ? "" : version.getEffectiveFrom().toString(),
                        "effective_to", version.getEffectiveTo() == null ? "" : version.getEffectiveTo().toString(),
                        "is_current", version.getIsCurrent()
                )
        );
    }

    @Override
    public Object getChunks(String documentId, String versionId, Integer pageNo, String chunkType, Integer pageSize, Integer pageNoNum) {
        UUID docId = UUID.fromString(documentId);
        int currentPage = pageNoNum == null ? 1 : pageNoNum;
        int currentSize = pageSize == null ? 50 : pageSize;
        List<KbChunk> chunks = versionId == null || versionId.isBlank()
                ? chunkRepository.findByDocumentId(docId)
                : chunkRepository.findByDocumentIdAndVersionId(docId, UUID.fromString(versionId));
        List<ChunkItemResponse> items = chunks.stream()
                .filter(chunk -> pageNo == null || pageNo.equals(chunk.getPageNo()))
                .filter(chunk -> chunkType == null || chunkType.isBlank() || chunkType.equals(chunk.getChunkType()))
                .sorted(Comparator.comparing(KbChunk::getChunkNo))
                .skip((long) Math.max(currentPage - 1, 0) * currentSize)
                .limit(currentSize)
                .map(chunk -> new ChunkItemResponse(
                        chunk.getId().toString(),
                        chunk.getChunkNo(),
                        chunk.getChunkType(),
                        nullToEmpty(chunk.getTitlePath()),
                        nullToEmpty(chunk.getLocator()),
                        chunk.getPageNo() == null ? 0 : chunk.getPageNo(),
                        nullToEmpty(chunk.getContentText()),
                        nullToEmpty(chunk.getContentSummary())
                ))
                .toList();
        return new PageResponse<>(chunks.size(), currentPage, currentSize, items);
    }

    @Override
    @Transactional
    public Object activateVersion(String documentId, String versionId, ActivateVersionRequest request) {
        UUID docId = UUID.fromString(documentId);
        UUID verId = UUID.fromString(versionId);
        KbDocument document = documentRepository.findById(docId).orElseThrow(() -> new NotFoundException("document not found"));
        List<KbDocumentVersion> versions = versionRepository.findByDocumentId(docId);
        if (versions.isEmpty()) {
            throw new NotFoundException("document version not found");
        }
        KbDocumentVersion target = null;
        for (KbDocumentVersion item : versions) {
            boolean current = item.getId().equals(verId);
            item.setIsCurrent(current);
            if (!current) {
                item.setEffectiveTo(OffsetDateTime.now());
            } else {
                target = item;
            }
        }
        if (target == null) {
            throw new NotFoundException("document version not found");
        }
        target.setEffectiveTo(null);
        target.setEffectiveFrom(request == null || request.effectiveFrom() == null || request.effectiveFrom().isBlank()
                ? OffsetDateTime.now()
                : OffsetDateTime.parse(request.effectiveFrom()));
        target.setRemark(request == null ? null : request.remark());
        versionRepository.saveAll(versions);
        document.setCurrentVersionId(verId);
        document.setStatus("active");
        documentRepository.save(document);
        return Map.of("document_id", documentId, "version_id", versionId, "status", "success");
    }

    private TaskResponse toTaskResponse(KbIngestTask task) {
        return new TaskResponse(
                task.getId().toString(), task.getTaskType(), task.getStatus(), task.getStep(), task.getRetryCount(),
                task.getErrorMessage(), task.getStartedAt() == null ? null : task.getStartedAt().toString(),
                task.getFinishedAt() == null ? null : task.getFinishedAt().toString());
    }

    private String resolveSourceType(String fileName) {
        int idx = fileName.lastIndexOf('.');
        return idx < 0 ? "unknown" : fileName.substring(idx + 1).toLowerCase();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}