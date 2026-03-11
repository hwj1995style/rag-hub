import { request } from '../http/client';
import type { SearchResponse } from '../../types/api';
export function searchKnowledge(payload: { query: string; topK?: number; filters?: Record<string, string> }) { return request<SearchResponse>({ url: '/api/search/query', method: 'POST', data: payload }); }
