import { AlertCircle, ScanFace, UserCheck, UserX } from 'lucide-react'

const STATES = {
  no_face: { label: 'No face', tone: 'bg-slate-100 text-slate-600' },
  tracking: { label: 'Tracking…', tone: 'bg-amber-100 text-amber-700' },
  announced: { label: 'Announced', tone: 'bg-emerald-100 text-emerald-700' },
}

// What the backend saw in the last frame
export default function RecognitionPanel({ running, result, error, stats }) {
  const state = result ? STATES[result.state] : null

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ScanFace className="h-4 w-4 text-teal-600" /> Face recognition
        </h2>
        {state && running && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${state.tone}`}>{state.label}</span>
        )}
      </div>

      {!running && <p className="text-sm text-slate-400">Start the camera to recognize visitors.</p>}
      {running && !result && !error && <p className="text-sm text-slate-400">Sending the first frame…</p>}

      {running && result && (
        <ul className="space-y-2">
          {result.faces.length === 0 && <li className="text-sm text-slate-400">Nobody in front of the camera.</li>}
          {result.faces.map((f, i) =>
            f.status === 'known' ? (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                <UserCheck className="h-6 w-6 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-emerald-900">{f.name}</p>
                  <p className="text-sm text-emerald-700">{f.relationship}</p>
                </div>
                <span className="text-xs text-emerald-600">distance {f.distance?.toFixed(2)}</span>
              </li>
            ) : (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
                <UserX className="h-6 w-6 shrink-0 text-amber-600" />
                <p className="flex-1 font-semibold text-amber-900">Unknown person</p>
                {f.distance != null && <span className="text-xs text-amber-600">closest {f.distance.toFixed(2)}</span>}
              </li>
            ),
          )}
        </ul>
      )}

      {error && running && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error} Retrying…
        </p>
      )}

      {running && stats.frames > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          {stats.frames} frames · last reply {stats.lastMs} ms (≈ {(1000 / Math.max(stats.lastMs, 1)).toFixed(1)}{' '}
          frames/s)
        </p>
      )}
    </section>
  )
}
