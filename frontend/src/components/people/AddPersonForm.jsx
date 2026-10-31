import { useEffect, useState } from 'react'
import { AlertCircle, Camera, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import * as api from '../../api'
import CameraCapture from './CameraCapture'
import FormField, { inputClass } from '../FormField'

// Name, relationship and a photo (upload or webcam). The backend checks there is exactly one face.
export default function AddPersonForm({ onAdded, onCancel }) {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [source, setSource] = useState('upload') // upload | camera
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!photo) {
      setPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const choosePhoto = (file) => {
    setPhoto(file)
    setError(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!photo) return setError('Please add a photo of the person.')
    setBusy(true)
    setError(null)
    try {
      await api.enrollPerson({ name: name.trim(), relationship: relationship.trim(), photo })
      onAdded()
    } catch (err) {
      setError(err.message) // e.g. "No face found in the photo..." from the backend
      setBusy(false)
    }
  }

  const tab = (key, label, Icon) => (
    <button
      type="button"
      onClick={() => {
        setSource(key)
        setPhoto(null)
      }}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
        source === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  )

  return (
    <form onSubmit={submit} className="card animate-fade-in space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Add a person</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      <FormField label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className={inputClass} />
      </FormField>
      <FormField label="Relationship" hint='Spoken as "This is your <relationship>, <name>"'>
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. daughter, neighbour, doctor"
          className={inputClass}
        />
      </FormField>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-600">Photo</span>
        <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1">
          {tab('upload', 'Upload', Upload)}
          {tab('camera', 'Webcam', Camera)}
        </div>

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Selected" className="aspect-[4/3] w-full rounded-2xl bg-slate-100 object-contain" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {source === 'camera' ? 'Retake' : 'Change'}
            </button>
          </div>
        ) : source === 'upload' ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-8 text-center text-slate-500 hover:border-teal-400 hover:bg-teal-50/40">
            <Upload className="h-7 w-7" />
            <span className="text-sm font-medium">Choose a clear, front-facing photo</span>
            <span className="text-xs text-slate-400">One person only · JPG or PNG</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && choosePhoto(e.target.files[0])}
            />
          </label>
        ) : (
          <CameraCapture onCapture={choosePhoto} />
        )}
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 disabled:opacity-70"
      >
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        {busy ? 'Checking the face…' : 'Save person'}
      </button>
    </form>
  )
}
