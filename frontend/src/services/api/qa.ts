import { request } from '../http/client';
import type { QaResponse, QueryLogDetail } from '../../types/api';
export function askQuestion(payload: { query: string; topK?: number; returnCitations?: boolean; filters?: Record<string, string>; sessionId?: string; }) { return request<QaResponse>({ url: '/api/qa/query', method: 'POST', data: payload }); }
export function getQueryLog(logId: string) { return request<QueryLogDetail>({ url: `/api/query-logs/${logId}`, method: 'GET' }); }
