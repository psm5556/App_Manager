export interface App {
  id: string
  name: string
  description: string
  app_type: 'fastapi' | 'dash' | 'custom'
  folder: string
  port: number
  start_command: string
  order: number
  conda_env: string
  created_at: string
  updated_at: string
  // runtime
  status: 'running' | 'stopped' | 'error'
  pid: number | null
  uptime: number | null
}

export interface AppCreate {
  name: string
  description?: string
  app_type?: string
  folder: string
  port: number
  start_command: string
  order?: number
  conda_env?: string
}

export interface AppUpdate {
  name?: string
  description?: string
  app_type?: string
  folder?: string
  port?: number
  start_command?: string
  order?: number
  conda_env?: string
}
