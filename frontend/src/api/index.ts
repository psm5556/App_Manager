import type { App, AppCreate, AppUpdate } from '../types'

const BASE = '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json()
}

export const api = {
  listApps:   ()                          => req<App[]>('/apps'),
  createApp:  (body: AppCreate)           => req<App>('/apps', { method: 'POST', body: JSON.stringify(body) }),
  updateApp:  (id: string, body: AppUpdate) => req<App>(`/apps/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteApp:  (id: string)                => req<{ ok: boolean }>(`/apps/${id}`, { method: 'DELETE' }),

  startApp:   (id: string)                => req<{ ok: boolean; pid: number }>(`/apps/${id}/start`, { method: 'POST' }),
  stopApp:    (id: string)                => req<{ ok: boolean }>(`/apps/${id}/stop`, { method: 'POST' }),
  startAll:   ()                          => req<{ results: unknown[] }>('/apps/start-all', { method: 'POST' }),
  stopAll:    ()                          => req<{ ok: boolean }>('/apps/stop-all', { method: 'POST' }),

  getLogs:    (id: string, lines = 200)   => req<{ logs: string }>(`/apps/${id}/logs?lines=${lines}`),
}
