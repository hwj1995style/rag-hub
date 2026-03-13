import { request } from '../http/client';
import type { PageResponse, QaResponse, QueryLogDetail, QueryLogListItem } from '../../types/api';

export function askQuestion(payload: { query: string; topK?: number; returnCitations?: boolean; filters?: Record<string, string>; sessionId?: string; }) {
  return request<QaResponse>({ url: '/api/qa/query', method: 'POST', data: payload });
}

export function listQueryLogs(params: { sessionId?: string; queryText?: string; pageNo?: number; pageSize?: number }) {
  return request<PageResponse<QueryLogListItem>>({ url: '/api/query-logs', method: 'GET', params });
}

export function getQueryLog(logId: string) {
  return request<QueryLogDetail>({ url: `/api/query-logs/${logId}`, method: 'GET' });
}
