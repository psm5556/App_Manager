import { useState } from 'react'
import { X } from 'lucide-react'
import type { App, AppCreate, AppUpdate } from '../types'

interface Props {
  app?: App
  onSave: (data: AppCreate | AppUpdate) => Promise<void>
  onClose: () => void
}

export default function AppModal({ app, onSave, onClose }: Props) {
  const [name,         setName]         = useState(app?.name ?? '')
  const [description,  setDescription]  = useState(app?.description ?? '')
  const [appType,      setAppType]      = useState<'fastapi' | 'dash' | 'custom'>((app?.app_type as 'fastapi' | 'dash' | 'custom') ?? 'custom')
  const [folder,       setFolder]       = useState(app?.folder ?? '')
  const [port,         setPort]         = useState(String(app?.port ?? ''))
  const [startCommand, setStartCommand] = useState(app?.start_command ?? '')
  const [order,        setOrder]        = useState(String(app?.order ?? '0'))
  const [condaEnv,     setCondaEnv]     = useState(app?.conda_env ?? 'base')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !folder.trim() || !startCommand.trim() || !port) {
      setError('이름, 폴더, 포트, 시작 명령은 필수입니다.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        app_type: appType,
        folder: folder.trim(),
        port: Number(port),
        start_command: startCommand.trim(),
        order: Number(order),
        conda_env: condaEnv.trim() || 'base',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
  const labelCls = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {app ? 'App 수정' : '새 App 추가'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>앱 이름 *</label>
              <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="My App" />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>설명</label>
              <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="앱 설명" />
            </div>

            <div>
              <label className={labelCls}>앱 타입</label>
              <select className={inputCls} value={appType} onChange={e => setAppType(e.target.value as 'fastapi' | 'dash' | 'custom')}>
                <option value="custom">Custom</option>
                <option value="fastapi">FastAPI + React</option>
                <option value="dash">Python Dash</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>포트 *</label>
              <input className={inputCls} type="number" value={port} onChange={e => setPort(e.target.value)} placeholder="8000" />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>폴더 경로 *</label>
              <input className={inputCls} value={folder} onChange={e => setFolder(e.target.value)} placeholder="/home/user/my-app" />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>시작 명령 *</label>
              <input className={inputCls} value={startCommand} onChange={e => setStartCommand(e.target.value)} placeholder="uvicorn main:app --port 8000" />
            </div>

            <div>
              <label className={labelCls}>Conda 환경</label>
              <input className={inputCls} value={condaEnv} onChange={e => setCondaEnv(e.target.value)} placeholder="base" />
            </div>

            <div>
              <label className={labelCls}>순서</label>
              <input className={inputCls} type="number" value={order} onChange={e => setOrder(e.target.value)} placeholder="0" />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
              취소
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50">
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
