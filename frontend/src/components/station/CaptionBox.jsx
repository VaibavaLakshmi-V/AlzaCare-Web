import { AlertTriangle, MessageCircle, Pill, ScanFace, Volume2 } from 'lucide-react'
import { formatDateTime } from '../../utils/time'

const KINDS = {
  recognition: { icon: ScanFace, label: 'Face recognition', tone: 'text-teal-600 bg-teal-50' },
  alert: { icon: AlertTriangle, label: 'Safety alert', tone: 'text-red-600 bg-red-50' },
  reminder: { icon: Pill, label: 'Reminder', tone: 'text-sky-600 bg-sky-50' },
}

// Large caption of the last spoken sentence, with a short history below
export default function CaptionBox({ captions }) {
  const [latest, ...older] = captions
  const kind = latest ? KINDS[latest.kind] : null

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Volume2 className="h-4 w-4 text-teal-600" /> Spoken to the patient
      </div>

      {latest ? (
        <div key={latest.id} className="animate-fade-in rounded-2xl bg-slate-900 px-6 py-7 text-center">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${kind.tone}`}>
            <kind.icon className="h-3.5 w-3.5" /> {kind.label}
          </span>
          <p className="mt-4 text-3xl font-semibold leading-snug text-white sm:text-4xl">“{latest.text}”</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-100 px-6 py-10 text-center text-slate-400">
          <MessageCircle className="h-8 w-8" />
          <p className="text-sm">Nothing spoken yet. Announcements, safety prompts and reminders appear here.</p>
        </div>
      )}

      {older.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {older.map((c) => {
            const Icon = KINDS[c.kind].icon
            return (
              <li key={c.id} className="flex items-center gap-2 text-sm text-slate-500">
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="flex-1 truncate">{c.text}</span>
                <span className="shrink-0 text-xs text-slate-400">{formatDateTime(c.at)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
