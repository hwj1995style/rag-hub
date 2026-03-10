package com.example.kb.controller;

import com.example.kb.common.ApiResponse;
import com.example.kb.dto.request.ActivateVersionRequest;
import com.example.kb.dto.request.BatchImportRequest;
import com.example.kb.dto.request.ReparseRequest;
import com.example.kb.service.DocumentService;
import jakarta.validation.constraints.Min;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/upload")
    public ApiResponse<Object> upload(@RequestPart("file") MultipartFile file,
                                      @RequestParam(required = false) String title,
                                      @RequestParam(required = false, name = "biz_domain") String bizDomain,
                                      @RequestParam(required = false) String department,
                                      @RequestParam(required = false, name = "security_level") String securityLevel,
                                      @RequestParam(required = false, name = "source_system") String sourceSystem,
                                      @RequestParam(required = false) String owner,
                                      @RequestParam(required = false, name = "permission_tags") String permissionTags) {
        return ApiResponse.success(documentService.upload(file, title, bizDomain, department, securityLevel, sourceSystem, owner, permissionTags));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/batch-import")
    public ApiResponse<Object> batchImport(@RequestBody BatchImportRequest request) {
        return ApiResponse.success(documentService.batchImport(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{documentId}/reparse")
    public ApiResponse<Object> reparse(@PathVariable String documentId, @RequestBody ReparseRequest request) {
        return ApiResponse.success(documentService.reparse(documentId, request));
    }

    @GetMapping
    public ApiResponse<Object> listDocuments(@RequestParam(required = false) String keyword,
                                             @RequestParam(required = false, name = "biz_domain") String bizDomain,
                                             @RequestParam(required = false) String department,
                                             @RequestParam(required = false) String status,
                                             @RequestParam(defaultValue = "1", name = "page_no") @Min(1) Integer pageNo,
                                             @RequestParam(defaultValue = "20", name = "page_size") @Min(1) Integer pageSize) {
        return ApiResponse.success(documentService.listDocuments(keyword, bizDomain, department, status, pageNo, pageSize));
    }

    @GetMapping("/{documentId}")
    public ApiResponse<Object> getDocument(@PathVariable String documentId) {
        return ApiResponse.success(documentService.getDocumentDetail(documentId));
    }

    @GetMapping("/{documentId}/chunks")
    public ApiResponse<Object> getChunks(@PathVariable String documentId,
                                         @RequestParam(required = false, name = "version_id") String versionId,
                                         @RequestParam(required = false, name = "page_no") Integer pageNo,
                                         @RequestParam(required = false, name = "chunk_type") String chunkType,
                                         @RequestParam(defaultValue = "50", name = "page_size") Integer pageSize,
                                         @RequestParam(defaultValue = "1", name = "page_no_num") Integer pageNoNum) {
        return ApiResponse.success(documentService.getChunks(documentId, versionId, pageNo, chunkType, pageSize, pageNoNum));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{documentId}/versions/{versionId}/activate")
    public ApiResponse<Object> activateVersion(@PathVariable String documentId,
                                               @PathVariable String versionId,
                                               @RequestBody ActivateVersionRequest request) {
        return ApiResponse.success(documentService.activateVersion(documentId, versionId, request));
    }
}
