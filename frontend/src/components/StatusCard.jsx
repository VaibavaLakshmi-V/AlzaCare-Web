import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { formatDistance } from '../utils/time'

const LOOKS = {
  safe: {
    box: 'from-emerald-500 to-teal-600 shadow-emerald-600/25',
    icon: ShieldCheck,
    title: 'Safe',
  },
  alert: {
    box: 'from-red-500 to-rose-600 shadow-red-600/30',
    icon: ShieldAlert,
    title: 'ALERT',
  },
  unknown: {
    box: 'from-slate-400 to-slate-500 shadow-slate-500/20',
    icon: ShieldQuestion,
    title: 'Waiting for data',
  },
}

// Big patient status card at the top of Home
export default function StatusCard({ patient, state, reason, distance }) {
  const look = LOOKS[state]
  const Icon = look.icon
  const dist = formatDistance(distance)

  return (
    <section className={`rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg ${look.box}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/80">Patient</p>
          <h1 className="text-xl font-semibold">{patient?.name ?? '…'}</h1>
          {patient?.age != null && <p className="text-sm text-white/80">{patient.age} years</p>}
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <Icon className="h-7 w-7" />
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-bold tracking-tight ${state === 'alert' ? 'text-4xl' : 'text-3xl'}`}>{look.title}</p>
          {reason && <p className="mt-1 text-sm text-white/90">{reason}</p>}
        </div>
        {dist && (
          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold">{dist}</p>
            <p className="text-xs text-white/80">from home</p>
          </div>
        )}
      </div>
    </section>
  )
}
