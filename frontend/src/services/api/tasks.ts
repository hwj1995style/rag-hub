import { request } from '../http/client';
import type { PageResponse, TaskResponse } from '../../types/api';

export function listTasks(params: Record<string, string | number | undefined>) {
  return request<PageResponse<TaskResponse>>({ url: '/api/tasks', method: 'GET', params });
}

export function getTask(taskId: string) {
  return request<TaskResponse>({ url: `/api/tasks/${taskId}`, method: 'GET' });
}