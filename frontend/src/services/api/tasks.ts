import { request } from '../http/client';
import type { PageResponse, TaskResponse } from '../../types/api';

export type ListTasksParams = {
  status?: string;
  taskType?: string;
  documentId?: string;
  sourceKeyword?: string;
  pageNo?: number;
  pageSize?: number;
};

export function listTasks(params: ListTasksParams) {
  return request<PageResponse<TaskResponse>>({ url: '/api/tasks', method: 'GET', params });
}

export function getTask(taskId: string) {
  return request<TaskResponse>({ url: `/api/tasks/${taskId}`, method: 'GET' });
}
