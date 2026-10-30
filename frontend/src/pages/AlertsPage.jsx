import { useEffect, useState } from 'react'
import { Inbox } from 'lucide-react'
import EventItem from '../components/EventItem'
import SnapshotModal from '../components/SnapshotModal'
import { useLiveData } from '../context/LiveDataContext'
import { useNow } from '../hooks/useNow'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'info', label: 'Info' },
]

export default function AlertsPage() {
  const { events, markAlertsSeen } = useLiveData()
  const [filter, setFilter] = useState('all')
  const [snapshotEvent, setSnapshotEvent] = useState(null)
  const now = useNow(30000)

  // Being on this page means new alerts are seen (clears the nav badge)
  useEffect(() => {
    markAlertsSeen()
  }, [events, markAlertsSeen])

  const counts = events.reduce((acc, e) => ({ ...acc, [e.severity]: (acc[e.severity] ?? 0) + 1 }), {})
  const shown = filter === 'all' ? events : events.filter((e) => e.severity === filter)

  return (
    <div>
      <h1 className="mb-3 px-1 text-xl font-semibold text-slate-800">Alerts & events</h1>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key
          const count = key === 'all' ? events.length : counts[key] ?? 0
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25' : 'bg-white text-slate-600 shadow-soft'
              }`}
            >
              {label}
              <span className={`text-xs ${active ? 'text-teal-100' : 'text-slate-400'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center text-slate-400">
          <Inbox className="h-10 w-10" />
          <p className="text-sm">No {filter === 'all' ? '' : `${filter} `}events</p>
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100 overflow-hidden">
          {shown.map((e) => (
            <li key={e.id} className="animate-fade-in">
              <EventItem event={e} now={now} onOpenSnapshot={setSnapshotEvent} />
            </li>
          ))}
        </ul>
      )}

      {snapshotEvent && <SnapshotModal event={snapshotEvent} onClose={() => setSnapshotEvent(null)} />}
    </div>
  )
}
