import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2, Pill, Plus, Trash2 } from 'lucide-react'
import * as api from '../../api'
import ConfirmDialog from '../ConfirmDialog'
import Toggle from '../Toggle'
import { inputClass } from '../FormField'

// Medication / daily reminders: spoken by the patient station at the set time
export default function RemindersSection() {
  const [reminders, setReminders] = useState(null)
  const [text, setText] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const load = useCallback(async () => {
    try {
      setReminders(await api.getReminders())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.createReminder({ text: text.trim(), time_of_day: time, active: true })
      setText('')
      setTime('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (reminder, active) => {
    // Optimistic: flip now, reload from the server either way
    setReminders((list) => list.map((r) => (r.id === reminder.id ? { ...r, active } : r)))
    try {
      await api.updateReminder(reminder.id, { active })
    } catch (err) {
      setError(err.message)
    }
    load()
  }

  return (
    <section className="card p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
        <Pill className="h-5 w-5 text-sky-600" /> Reminders
      </h2>
      <p className="mb-4 text-sm text-slate-500">Spoken aloud on the patient station at the set time.</p>

      {reminders === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : reminders.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">No reminders yet.</p>
      ) : (
        <ul className="mb-4 divide-y divide-slate-100">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <span
                className={`w-14 shrink-0 font-semibold tabular-nums ${r.active ? 'text-slate-800' : 'text-slate-400'}`}
              >
                {r.time_of_day}
              </span>
              <span className={`min-w-0 flex-1 break-words text-sm ${r.active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                {r.text}
              </span>
              <Toggle checked={r.active} onChange={(v) => toggle(r, v)} label={`Turn ${r.text} on or off`} />
              <button
                onClick={() => setToDelete(r)}
                aria-label={`Delete ${r.text}`}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          maxLength={255}
          placeholder="e.g. Take the blood pressure tablet"
          className={`${inputClass} min-w-0 flex-[1_1_12rem]`}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          aria-label="Time"
          className={`${inputClass} w-32 flex-none`}
        />
        <button
          type="submit"
          disabled={busy}
          className="flex flex-none items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </button>
      </form>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete reminder?"
          message={`"${toDelete.text}" at ${toDelete.time_of_day} will no longer be spoken.`}
          onConfirm={async () => {
            await api.deleteReminder(toDelete.id)
            setToDelete(null)
            load()
          }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </section>
  )
}
