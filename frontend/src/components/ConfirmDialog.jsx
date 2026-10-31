import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

// Bottom-sheet confirmation. onConfirm may be async; errors are shown in the sheet.
export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-800">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
          </div>
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-70"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
