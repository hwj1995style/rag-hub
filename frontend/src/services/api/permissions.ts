import { request } from '../http/client';
import type { PermissionBindResponse } from '../../types/api';
export function bindPermissions(payload: { resourceType: string; resourceId: string; policies: Array<{ subjectType: string; subjectValue: string; effect: string }>; }) { return request<PermissionBindResponse>({ url: '/api/permissions/bind', method: 'POST', data: payload }); }
