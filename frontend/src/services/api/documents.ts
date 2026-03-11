import { request } from '../http/client';
import type { BatchImportResponse, DocumentDetail, DocumentListItem, PageResponse, ChunkItem, TaskResponse, UploadResponse } from '../../types/api';
export function listDocuments(params: Record<string, string | number | undefined>) { return request<PageResponse<DocumentListItem>>({ url: '/api/documents', method: 'GET', params }); }
export function getDocument(documentId: string) { return request<DocumentDetail>({ url: `/api/documents/${documentId}`, method: 'GET' }); }
export function getDocumentChunks(documentId: string, params: Record<string, string | number | undefined>) { return request<PageResponse<ChunkItem>>({ url: `/api/documents/${documentId}/chunks`, method: 'GET', params }); }
export function uploadDocument(formData: FormData) { return request<UploadResponse>({ url: '/api/documents/upload', method: 'POST', data: formData, headers: { 'Content-Type': 'multipart/form-data' } }); }
export function batchImportDocuments(payload: { sourceType: string; sourceUri: string; bizDomain?: string; department?: string; securityLevel?: string; }) { return request<BatchImportResponse>({ url: '/api/documents/batch-import', method: 'POST', data: payload }); }
export function reparseDocument(documentId: string, payload: { forceReindex?: boolean; reason?: string }) { return request<TaskResponse>({ url: `/api/documents/${documentId}/reparse`, method: 'POST', data: payload }); }
export function activateDocumentVersion(documentId: string, versionId: string, payload: { effectiveFrom?: string; remark?: string }) { return request<{ document_id: string; version_id: string; status: string }>({ url: `/api/documents/${documentId}/versions/${versionId}/activate`, method: 'POST', data: payload }); }
