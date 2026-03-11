import { request } from '../http/client';
import type { LoginResponse } from '../../types/api';
export function login(payload: { username: string; password: string }) { return request<LoginResponse>({ url: '/api/auth/login', method: 'POST', data: payload }); }
