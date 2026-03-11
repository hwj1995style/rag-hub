import { request } from '../http/client';
import type { TaskResponse } from '../../types/api';
export function getTask(taskId: string) { return request<TaskResponse>({ url: `/api/tasks/${taskId}`, method: 'GET' }); }
