import { request } from '../http/client';
import type { PermissionBindResponse, PermissionDeleteResponse, PermissionPolicyListResponse } from '../../types/api';

export type PermissionListParams = {
  resourceType?: string;
  resourceId?: string;
  subjectType?: string;
  subjectValue?: string;
  effect?: string;
};

export function bindPermissions(payload: {
  resourceType: string;
  resourceId: string;
  policies: Array<{ subjectType: string; subjectValue: string; effect: string }>;
}) {
  return request<PermissionBindResponse>({ url: '/api/permissions/bind', method: 'POST', data: payload });
}

export function listPermissions(params: PermissionListParams) {
  return request<PermissionPolicyListResponse>({ url: '/api/permissions', method: 'GET', params });
}

export function deletePermission(policyId: string) {
  return request<PermissionDeleteResponse>({ url: `/api/permissions/${policyId}`, method: 'DELETE' });
}
