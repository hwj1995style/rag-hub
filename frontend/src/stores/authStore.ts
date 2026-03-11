import { create } from 'zustand';
import type { LoginResponse } from '../types/api';
type AuthUser = LoginResponse['user'];
type AuthSnapshot = { tokenType: string; accessToken: string; expiresInSeconds: number; user: AuthUser | null; };
type AuthState = AuthSnapshot & { isAuthenticated: boolean; hydrate: () => void; setSession: (payload: LoginResponse) => void; clearSession: () => void; };
const STORAGE_KEY = 'rag-hub-auth';
function loadStoredSession(): AuthSnapshot | null { if (typeof window === 'undefined') return null; const raw = window.localStorage.getItem(STORAGE_KEY); if (!raw) return null; try { return JSON.parse(raw) as AuthSnapshot; } catch { window.localStorage.removeItem(STORAGE_KEY); return null; } }
function persist(snapshot: AuthSnapshot | null) { if (typeof window === 'undefined') return; if (!snapshot) { window.localStorage.removeItem(STORAGE_KEY); return; } window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); }
const stored = loadStoredSession();
export const useAuthStore = create<AuthState>((set) => ({ tokenType: stored?.tokenType ?? 'Bearer', accessToken: stored?.accessToken ?? '', expiresInSeconds: stored?.expiresInSeconds ?? 0, user: stored?.user ?? null, isAuthenticated: Boolean(stored?.accessToken), hydrate: () => { const snapshot = loadStoredSession(); set({ tokenType: snapshot?.tokenType ?? 'Bearer', accessToken: snapshot?.accessToken ?? '', expiresInSeconds: snapshot?.expiresInSeconds ?? 0, user: snapshot?.user ?? null, isAuthenticated: Boolean(snapshot?.accessToken) }); }, setSession: (payload) => { const snapshot: AuthSnapshot = { tokenType: payload.tokenType, accessToken: payload.accessToken, expiresInSeconds: payload.expiresInSeconds, user: payload.user }; persist(snapshot); set({ ...snapshot, isAuthenticated: true }); }, clearSession: () => { persist(null); set({ tokenType: 'Bearer', accessToken: '', expiresInSeconds: 0, user: null, isAuthenticated: false }); } }));
