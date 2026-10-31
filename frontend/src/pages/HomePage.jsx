import { Link } from 'react-router-dom'
import {
  AlertCircle, BatteryFull, BatteryLow, BatteryMedium, ChevronRight, RefreshCw, UserCheck,
} from 'lucide-react'
import EventItem from '../components/EventItem'
import StatusCard from '../components/StatusCard'
import VitalCard from '../components/VitalCard'
import { useLiveData } from '../context/LiveDataContext'
import { useNow } from '../hooks/useNow'
import { timeAgo } from '../utils/time'
import { BATTERY_LOW, RECENT_CRITICAL_MS } from '../utils/thresholds'

function batteryIcon(level) {
  if (level == null || level >= 60) return BatteryFull
  return level >= BATTERY_LOW ? BatteryMedium : BatteryLow
}

export default function HomePage() {
  const { patient, events, reading, inSafeZone, distance, simulated, lastKnownPerson, loadError, refresh } =
    useLiveData()
  const now = useNow(15000)

  // Safe = inside the zone and no critical event in the last 10 minutes
  const recentCritical = events.find(
    (e) => e.severity === 'critical' && e.type !== 'sms' && now - Date.parse(e.created_at) < RECENT_CRITICAL_MS,
  )
  let state = 'safe'
  let reason = 'Inside the safe zone'
  if (inSafeZone === false) {
    state = 'alert'
    reason = 'Outside the safe zone'
  } else if (recentCritical) {
    state = 'alert'
    reason = `${recentCritical.message} · ${timeAgo(recentCritical.created_at, now)}`
  } else if (inSafeZone == null) {
    state = 'unknown'
    reason = 'No location yet'
  }

  const battery = reading?.battery

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="card flex items-center gap-3 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{loadError}</span>
          <button onClick={refresh} className="rounded-full p-2 hover:bg-red-50" aria-label="Retry">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      <StatusCard patient={patient} state={state} reason={reason} distance={distance} />

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-700">Wearable</h2>
          {simulated && (
            <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-violet-700">
              SIMULATED SENSORS
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3">
          <VitalCard
            icon={batteryIcon(battery)}
            label="Battery"
            value={battery != null ? Math.round(battery) : null}
            unit="%"
            alert={battery != null && battery < BATTERY_LOW}
            hint={battery != null && battery < BATTERY_LOW ? 'Charge now' : 'Wearable'}
          />
        </div>
      </section>

      <section className="card flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <UserCheck className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Last recognized person</p>
          {lastKnownPerson ? (
            <>
              <p className="truncate font-semibold text-slate-800">{lastKnownPerson.message}</p>
              <p className="text-xs text-slate-400">{timeAgo(lastKnownPerson.created_at, now)}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Nobody recognized yet</p>
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 pb-1 pt-4">
          <h2 className="text-sm font-semibold text-slate-700">Live feed</h2>
          <Link to="/alerts" className="flex items-center text-sm font-medium text-teal-600">
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="px-4 pb-5 pt-2 text-sm text-slate-400">No events yet</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.slice(0, 5).map((e) => (
              <li key={e.id} className="animate-fade-in">
                <EventItem event={e} now={now} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
