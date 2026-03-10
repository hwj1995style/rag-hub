package com.example.kb.service;

import com.example.kb.dto.request.ActivateVersionRequest;
import com.example.kb.dto.request.BatchImportRequest;
import com.example.kb.dto.request.ReparseRequest;
import com.example.kb.dto.response.TaskResponse;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentService {
    Object upload(MultipartFile file, String title, String bizDomain, String department, String securityLevel,
                  String sourceSystem, String owner, String permissionTags);
    Object batchImport(BatchImportRequest request);
    TaskResponse reparse(String documentId, ReparseRequest request);
    Object listDocuments(String keyword, String bizDomain, String department, String status, Integer pageNo, Integer pageSize);
    Object getDocumentDetail(String documentId);
    Object getChunks(String documentId, String versionId, Integer pageNo, String chunkType, Integer pageSize, Integer pageNoNum);
    Object activateVersion(String documentId, String versionId, ActivateVersionRequest request);
}
