import { useState } from 'react'
import {
  AlertCircle, Armchair, BatteryLow, Footprints, House, Loader2, PersonStanding, RotateCcw, Route,
} from 'lucide-react'
import * as api from '../../api'
import { useLiveData } from '../../context/LiveDataContext'
import { formatDistance } from '../../utils/time'
import { BATTERY_LOW } from '../../utils/thresholds'

const SCENARIOS = [
  { key: 'walk', label: 'Walk', icon: Footprints },
  { key: 'sit', label: 'Sit', icon: Armchair },
  { key: 'fall', label: 'Fall', icon: PersonStanding, danger: true },
  { key: 'wander', label: 'Wander', icon: Route, danger: true },
  { key: 'return_home', label: 'Return home', icon: House },
  { key: 'low_battery', label: 'Low battery', icon: BatteryLow, danger: true },
  { key: 'normal', label: 'Normal', icon: RotateCcw },
]

const FALL_IMPACT_G = 2.5

function Readout({ label, value, alert }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${alert ? 'bg-red-50' : 'bg-slate-50'}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`font-semibold tabular-nums ${alert ? 'text-red-600' : 'text-slate-800'}`}>{value ?? '—'}</p>
    </div>
  )
}

// Scenario buttons for the simulated wearable + live sensor values
export default function SimulatorPanel() {
  const { scenario, reading, inSafeZone, distance } = useLiveData()
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  const choose = async (key) => {
    setPending(key)
    setError(null)
    try {
      await api.setScenario(key)
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(null)
    }
  }

  const accel = reading ? Math.hypot(reading.ax, reading.ay, reading.az) : null

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between bg-violet-600 px-5 py-3 text-white">
        <h2 className="text-sm font-bold tracking-wider">SIMULATED SENSORS</h2>
        <span className="text-xs text-violet-100">Simulator control</span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {SCENARIOS.map(({ key, label, icon: Icon, danger }) => {
            const current = (pending ?? scenario) === key
            return (
              <button
                key={key}
                onClick={() => choose(key)}
                disabled={pending !== null}
                className={`flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 text-center text-sm font-semibold transition ${
                  current
                    ? danger
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {pending === key ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
                {label}
              </button>
            )
          })}
        </div>
        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-700">Live sensor readout</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Readout
            label="Acceleration"
            value={accel != null ? `${accel.toFixed(2)} g` : null}
            alert={accel != null && accel > FALL_IMPACT_G}
          />
          <Readout
            label="Battery"
            value={reading ? `${Math.round(reading.battery)}%` : null}
            alert={reading?.battery < BATTERY_LOW}
          />
          <Readout
            label="Safe zone"
            value={inSafeZone == null ? null : `${inSafeZone ? 'Inside' : 'Outside'} · ${formatDistance(distance)}`}
            alert={inSafeZone === false}
          />
          <Readout
            label="GPS"
            value={reading ? `${reading.lat.toFixed(5)}, ${reading.lng.toFixed(5)}` : null}
          />
        </div>
      </div>
    </section>
  )
}
