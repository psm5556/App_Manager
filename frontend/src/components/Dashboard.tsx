import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Play, Square, Sun, Moon } from 'lucide-react'
import { api } from '../api'
import { useWebSocket } from '../hooks/useWebSocket'
import type { App, AppCreate, AppUpdate } from '../types'
import AppCard from './AppCard'
import AppModal from './AppModal'
import LogModal from './LogModal'

export default function Dashboard() {
  const qc = useQueryClient()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [showModal, setShowModal] = useState(false)
  const [editApp,   setEditApp]   = useState<App | undefined>()
  const [logApp,    setLogApp]    = useState<App | undefined>()

  function toggleDark() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    setDark(next)
  }

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: api.listApps,
    refetchInterval: 5000,
  })

  useWebSocket((msg: unknown) => {
    const m = msg as { type: string; data?: Record<string, { status: string; pid: number | null; uptime: number | null }> }
    if (m.type === 'status_poll' && m.data) {
      qc.setQueryData<App[]>(['apps'], (old) => {
        if (!old) return old
        return old.map(app => {
          const rt = m.data![app.id]
          return rt ? { ...app, status: rt.status as App['status'], pid: rt.pid, uptime: rt.uptime } : app
        })
      })
    } else {
      const refetchTypes = ['app_created','app_updated','app_deleted','app_started','app_stopped','bulk_start','bulk_stop']
      if (refetchTypes.includes(m.type)) {
        qc.invalidateQueries({ queryKey: ['apps'] })
      }
    }
  })

  const createMut = useMutation({
    mutationFn: (body: AppCreate) => api.createApp(body),
    onSuccess: (newApp) => {
      qc.setQueryData<App[]>(['apps'], (old = []) => [...old, newApp])
      setShowModal(false)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: AppUpdate }) => api.updateApp(id, body),
    onSuccess: (updatedApp) => {
      qc.setQueryData<App[]>(['apps'], (old = []) =>
        old.map(a => a.id === updatedApp.id ? updatedApp : a)
      )
      setEditApp(undefined)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteApp(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apps'] }),
  })

  const startMut  = useMutation({ mutationFn: api.startApp,  onSuccess: () => qc.invalidateQueries({ queryKey: ['apps'] }) })
  const stopMut   = useMutation({ mutationFn: api.stopApp,   onSuccess: () => qc.invalidateQueries({ queryKey: ['apps'] }) })
  const startAll  = useMutation({ mutationFn: api.startAll,  onSuccess: () => qc.invalidateQueries({ queryKey: ['apps'] }) })
  const stopAll   = useMutation({ mutationFn: api.stopAll,   onSuccess: () => qc.invalidateQueries({ queryKey: ['apps'] }) })

  const runningCount = apps.filter(a => a.status === 'running').length

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Navbar */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AM</span>
            </div>
            <h1 className="font-bold text-slate-900 dark:text-white">App Manager</h1>
            <span className="text-xs text-slate-400 hidden sm:block">
              {runningCount}/{apps.length} 실행 중
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startAll.mutate()}
              disabled={startAll.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 disabled:opacity-50"
            >
              <Play size={12} /> 전체 실행
            </button>
            <button
              onClick={() => stopAll.mutate()}
              disabled={stopAll.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50"
            >
              <Square size={12} /> 전체 중지
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus size={12} /> 앱 추가
            </button>
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400">불러오는 중…</div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 mb-4">등록된 앱이 없습니다.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm"
            >
              첫 번째 앱 추가
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {apps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                onStart={()  => startMut.mutateAsync(app.id)}
                onStop={()   => stopMut.mutateAsync(app.id)}
                onEdit={()   => setEditApp(app)}
                onDelete={async () => {
                  if (confirm(`"${app.name}"을(를) 삭제하시겠습니까?`)) {
                    deleteMut.mutate(app.id)
                  }
                }}
                onLogs={() => setLogApp(app)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showModal && (
        <AppModal
          onSave={async (data) => { await createMut.mutateAsync(data as AppCreate) }}
          onClose={() => setShowModal(false)}
        />
      )}
      {editApp && (
        <AppModal
          app={editApp}
          onSave={async (data) => { await updateMut.mutateAsync({ id: editApp.id, body: data as AppUpdate }) }}
          onClose={() => setEditApp(undefined)}
        />
      )}
      {logApp && (
        <LogModal
          app={logApp}
          onClose={() => setLogApp(undefined)}
        />
      )}
    </div>
  )
}
