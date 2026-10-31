import { useState } from 'react'
import { AlertCircle, Loader2, LocateFixed, Pencil, UserRound } from 'lucide-react'
import * as api from '../../api'
import FormField, { inputClass } from '../FormField'

const toForm = (p) => ({
  name: p.name ?? '',
  age: p.age ?? '',
  notes: p.notes ?? '',
  home_lat: p.home_lat ?? '',
  home_lng: p.home_lng ?? '',
  safe_radius_m: p.safe_radius_m ?? '',
})

// Empty field -> null, otherwise a number
const num = (v) => (v === '' || v == null ? null : Number(v))

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{children ?? '—'}</span>
    </div>
  )
}

// View / edit the patient profile, home location and safe radius
export default function PatientProfile({ patient, onSaved }) {
  const [form, setForm] = useState(null) // null = viewing
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const fillMyLocation = () => {
    setError(null)
    if (!navigator.geolocation) return setError('This browser cannot share its location.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((f) => ({ ...f, home_lat: coords.latitude.toFixed(6), home_lng: coords.longitude.toFixed(6) }))
        setLocating(false)
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission is blocked (browsers only allow it on https or localhost).'
            : 'Could not get your current location. Try again or type the coordinates.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.updatePatient({
        name: form.name.trim(),
        age: num(form.age),
        notes: form.notes.trim() || null,
        home_lat: num(form.home_lat),
        home_lng: num(form.home_lng),
        safe_radius_m: num(form.safe_radius_m),
      })
      await onSaved()
      setForm(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!patient) return <section className="card p-5 text-sm text-slate-400">Loading patient…</section>

  if (!form) {
    return (
      <section className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <UserRound className="h-5 w-5 text-teal-600" /> Patient profile
          </h2>
          <button
            onClick={() => setForm(toForm(patient))}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          <Row label="Name">{patient.name}</Row>
          <Row label="Age">{patient.age}</Row>
          <Row label="Notes">{patient.notes}</Row>
          <Row label="Home">
            {patient.home_lat != null ? `${patient.home_lat.toFixed(5)}, ${patient.home_lng.toFixed(5)}` : null}
          </Row>
          <Row label="Safe radius">{`${patient.safe_radius_m} m`}</Row>
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-slate-800">
        <UserRound className="h-5 w-5 text-teal-600" /> Edit patient profile
      </h2>
      <FormField label="Name">
        <input value={form.name} onChange={set('name')} required maxLength={100} className={inputClass} />
      </FormField>
      <FormField label="Age">
        <input type="number" min="0" max="130" value={form.age} onChange={set('age')} className={inputClass} />
      </FormField>
      <FormField label="Notes" hint="Medical notes, habits, anything a carer should know">
        <textarea value={form.notes} onChange={set('notes')} rows={3} className={inputClass} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Home latitude">
          <input
            type="number" step="any" min="-90" max="90"
            value={form.home_lat} onChange={set('home_lat')} className={inputClass}
          />
        </FormField>
        <FormField label="Home longitude">
          <input
            type="number" step="any" min="-180" max="180"
            value={form.home_lng} onChange={set('home_lng')} className={inputClass}
          />
        </FormField>
      </div>
      <button
        type="button"
        onClick={fillMyLocation}
        disabled={locating}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-teal-600 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-60"
      >
        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        Use my current location
      </button>
      <FormField label="Safe radius (meters)" hint="An alert is sent when the patient goes further than this from home">
        <input
          type="number" min="10" step="1" required
          value={form.safe_radius_m} onChange={set('safe_radius_m')} className={inputClass}
        />
      </FormField>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setForm(null)
            setError(null)
          }}
          className="rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
      </div>
    </form>
  )
}
