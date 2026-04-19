import { useEffect, useRef } from 'react'

type Handler = (data: unknown) => void

export function useWebSocket(onMessage: Handler) {
  const cbRef = useRef(onMessage)
  cbRef.current = onMessage

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url   = `${proto}://${window.location.host}/ws`
    let ws: WebSocket
    let timer: ReturnType<typeof setTimeout>

    function connect() {
      ws = new WebSocket(url)
      ws.onmessage = (e) => {
        try { cbRef.current(JSON.parse(e.data)) } catch { /* ignore */ }
      }
      ws.onclose = () => { timer = setTimeout(connect, 3000) }
    }

    connect()
    return () => {
      clearTimeout(timer)
      ws.close()
    }
  }, [])
}
