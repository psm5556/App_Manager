import { useEffect, useRef, useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { api } from '../api'
import type { App } from '../types'

interface Props {
  app: App
  onClose: () => void
}

export default function LogModal({ app, onClose }: Props) {
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function fetchLogs() {
    setLoading(true)
    try {
      const data = await api.getLogs(app.id, 300)
      setLogs(data.logs)
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50)
    } catch {
      setLogs('(로그를 불러올 수 없습니다)')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [app.id])

  useEffect(() => {
    if (app.status !== 'running') return
    const id = setInterval(fetchLogs, 3000)
    return () => clearInterval(id)
  }, [app.id, app.status])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">{app.name} — 로그</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{app.folder}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-950 rounded-b-xl p-4">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
            {logs || '(로그 없음)'}
          </pre>
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
