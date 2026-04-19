import { useState } from 'react'
import { Play, Square, ExternalLink, FileText, Pencil, Trash2, Clock, Hash } from 'lucide-react'
import type { App } from '../types'

interface Props {
  app: App
  onStart:  () => void
  onStop:   () => void
  onEdit:   () => void
  onDelete: () => void
  onLogs:   () => void
}

function formatUptime(seconds: number): string {
  if (seconds < 60)   return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

const TYPE_LABEL: Record<string, string> = {
  fastapi: 'FastAPI',
  dash: 'Dash',
  custom: 'Custom',
}

export default function AppCard({ app, onStart, onStop, onEdit, onDelete, onLogs }: Props) {
  const [busy, setBusy] = useState(false)
  const isRunning = app.status === 'running'

  async function toggle() {
    setBusy(true)
    try { isRunning ? await onStop() : await onStart() }
    finally { setBusy(false) }
  }

  const statusDot = isRunning
    ? 'bg-emerald-400 animate-pulse'
    : 'bg-slate-400'

  const statusText = isRunning ? 'Running' : 'Stopped'

  const statusBadge = isRunning
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{app.name}</h3>
          </div>
          {app.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{app.description}</p>
          )}
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusBadge}`}>
          {statusText}
        </span>
      </div>

      {/* Meta */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1 overflow-hidden">
          <Hash size={11} className="flex-shrink-0" />
          <span className="truncate">Port {app.port}</span>
        </div>
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wide opacity-60">
            {TYPE_LABEL[app.app_type] ?? app.app_type}
          </span>
        </div>
        <div className="flex items-center gap-1 col-span-2 overflow-hidden">
          <span className="opacity-60 flex-shrink-0">env</span>
          <span className="truncate font-mono">{app.conda_env || 'base'}</span>
        </div>
        {isRunning && app.pid && (
          <div className="flex items-center gap-1">
            <span className="opacity-60">PID</span>
            <span>{app.pid}</span>
          </div>
        )}
        {isRunning && app.uptime != null && (
          <div className="flex items-center gap-1">
            <Clock size={11} className="flex-shrink-0" />
            <span>{formatUptime(app.uptime)}</span>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="mt-auto px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
        <button
          onClick={toggle}
          disabled={busy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
            isRunning
              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
          }`}
        >
          {isRunning ? <Square size={12} /> : <Play size={12} />}
          {isRunning ? '중지' : '실행'}
        </button>

        {isRunning && (
          <a
            href={`http://${window.location.hostname}:${app.port}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50"
          >
            <ExternalLink size={12} />
            열기
          </a>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onLogs}
            title="로그"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={onEdit}
            title="수정"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            title="삭제"
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
