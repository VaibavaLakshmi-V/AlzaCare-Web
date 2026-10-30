import { useEffect, useRef, useState } from 'react'
import { wsUrl } from '../api'

const MAX_RETRY_MS = 10000

// Keeps a WebSocket open to /ws, reconnecting with backoff (1s, 2s, 4s ... 10s) if it drops.
// Returns whether it is currently connected.
export function useLiveSocket(token, { onMessage, onReconnect }) {
  const [connected, setConnected] = useState(false)
  // Refs so new handler functions don't force a reconnect
  const handlers = useRef({ onMessage, onReconnect })
  handlers.current = { onMessage, onReconnect }

  useEffect(() => {
    if (!token) return undefined
    let ws
    let retryTimer
    let attempt = 0
    let everConnected = false
    let stopped = false

    const connect = () => {
      ws = new WebSocket(wsUrl(token))
      ws.onopen = () => {
        attempt = 0
        setConnected(true)
        if (everConnected) handlers.current.onReconnect?.() // catch up on anything missed
        everConnected = true
      }
      ws.onmessage = (e) => {
        try {
          handlers.current.onMessage?.(JSON.parse(e.data))
        } catch {
          // ignore malformed messages
        }
      }
      ws.onclose = () => {
        setConnected(false)
        if (stopped) return
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempt, MAX_RETRY_MS))
        attempt += 1
      }
    }

    connect()
    return () => {
      stopped = true
      clearTimeout(retryTimer)
      ws?.close()
    }
  }, [token])

  return connected
}
