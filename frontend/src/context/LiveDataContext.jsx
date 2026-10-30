import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../api'
import { useAuth } from './AuthContext'
import { useLiveSocket } from '../hooks/useLiveSocket'
import { isAlert } from '../utils/eventMeta'

const BANNER_MS = 8000
const LiveDataContext = createContext(null)

// Patient overview: loaded once from the REST API, then kept fresh by the WebSocket
export function LiveDataProvider({ children }) {
  const { token } = useAuth()
  const [patient, setPatient] = useState(null)
  const [status, setStatus] = useState(null) // GET /status
  const [sensor, setSensor] = useState(null) // latest "sensor" WebSocket message
  const [events, setEvents] = useState([]) // newest first
  const [loadError, setLoadError] = useState(null)
  const [banner, setBanner] = useState(null) // critical event shown at the top
  const [unseenAlerts, setUnseenAlerts] = useState(0)
  const bannerTimer = useRef()

  const refresh = useCallback(async () => {
    try {
      const [p, s, e] = await Promise.all([api.getPatient(), api.getStatus(), api.getEvents()])
      setPatient(p)
      setStatus(s)
      setEvents(e)
      setLoadError(null)
    } catch (err) {
      if (err.status !== 401) setLoadError(err.message)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const showBanner = useCallback((event) => {
    clearTimeout(bannerTimer.current)
    setBanner(event)
    bannerTimer.current = setTimeout(() => setBanner(null), BANNER_MS)
  }, [])
  const dismissBanner = useCallback(() => {
    clearTimeout(bannerTimer.current)
    setBanner(null)
  }, [])
  useEffect(() => () => clearTimeout(bannerTimer.current), [])

  const onMessage = useCallback(
    (msg) => {
      if (msg.kind === 'sensor') {
        setSensor(msg)
      } else if (msg.kind === 'event') {
        const { kind, ...event } = msg
        setEvents((prev) => (prev.some((e) => e.id === event.id) ? prev : [event, ...prev]))
        if (isAlert(event)) setUnseenAlerts((n) => n + 1)
        if (event.severity === 'critical' && event.type !== 'sms') showBanner(event)
      }
    },
    [showBanner],
  )

  const connected = useLiveSocket(token, { onMessage, onReconnect: refresh })
  const markAlertsSeen = useCallback(() => setUnseenAlerts(0), [])

  const value = useMemo(() => {
    // Prefer the live sensor message, fall back to the /status snapshot
    const reading = sensor?.reading ?? status?.reading ?? null
    const inSafeZone = sensor ? sensor.in_safe_zone : status?.in_safe_zone ?? null
    const distance = sensor ? sensor.distance_from_home_m : status?.distance_from_home_m ?? null
    const simulated = sensor?.simulated ?? status?.simulated ?? false
    const lastKnownPerson = events.find((e) => e.type === 'face_known') ?? status?.last_known_person ?? null
    return {
      patient, status, events, reading, inSafeZone, distance, simulated, lastKnownPerson,
      connected, loadError, refresh, banner, dismissBanner, unseenAlerts, markAlertsSeen,
    }
  }, [patient, status, sensor, events, connected, loadError, refresh, banner, dismissBanner, unseenAlerts, markAlertsSeen])

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>
}

export function useLiveData() {
  return useContext(LiveDataContext)
}
