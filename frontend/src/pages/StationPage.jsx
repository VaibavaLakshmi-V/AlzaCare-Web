import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Camera, CameraOff, Clock, Pill, VolumeX } from 'lucide-react'
import Logo from '../components/Logo'
import CaptionBox from '../components/station/CaptionBox'
import RecognitionPanel from '../components/station/RecognitionPanel'
import SimulatorPanel from '../components/station/SimulatorPanel'
import { useLiveData } from '../context/LiveDataContext'
import { useAlertVoice } from '../hooks/useAlertVoice'
import { useCamera } from '../hooks/useCamera'
import { useRecognitionLoop } from '../hooks/useRecognitionLoop'
import { useReminderAnnouncer } from '../hooks/useReminderAnnouncer'
import { hasUserActivation, speak, speechSupported } from '../utils/speech'

const MAX_CAPTIONS = 6

// Laptop stand-in for the wearable: webcam recognition, voice prompts, reminders, simulator control
export default function StationPage() {
  const { connected, onLiveEvent } = useLiveData()
  const [captions, setCaptions] = useState([])
  const [voiceReady, setVoiceReady] = useState(hasUserActivation)
  const captionId = useRef(0)

  // The only way anything is spoken: backend announcements, alert prompts and reminders
  const say = useCallback((text, kind) => {
    speak(text)
    setCaptions((c) => [{ id: ++captionId.current, text, kind, at: Date.now() }, ...c].slice(0, MAX_CAPTIONS))
  }, [])

  const camera = useCamera()
  const recognition = useRecognitionLoop(camera.videoRef, (sentence) => say(sentence, 'recognition'))
  useAlertVoice(onLiveEvent, say)
  const reminders = useReminderAnnouncer(say)

  // Browsers only allow speech after a first click/key press on the page
  useEffect(() => {
    if (voiceReady) return undefined
    const ready = () => setVoiceReady(true)
    window.addEventListener('pointerdown', ready, { once: true })
    window.addEventListener('keydown', ready, { once: true })
    return () => {
      window.removeEventListener('pointerdown', ready)
      window.removeEventListener('keydown', ready)
    }
  }, [voiceReady])

  const start = async () => {
    if (await camera.start()) recognition.start()
  }
  const stop = () => {
    recognition.stop()
    camera.stop()
  }

  const activeReminders = reminders.filter((r) => r.active).sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 sm:inline">
              Patient station
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                connected ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-teal-500' : 'bg-slate-400'}`} />
              {connected ? 'Live' : 'Connecting…'}
            </span>
            <Link
              to="/more"
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" /> Caregiver app
            </Link>
          </div>
        </div>
      </header>

      {(!speechSupported || !voiceReady) && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <p className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <VolumeX className="h-5 w-5 shrink-0" />
            {speechSupported
              ? 'Click anywhere on this page once to turn on the voice (browsers block sound until you interact).'
              : 'This browser cannot speak. Sentences will only be shown as captions.'}
          </p>
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-2">
        {/* Left: camera, caption, recognition */}
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <div className="relative aspect-video bg-slate-900">
              <video
                ref={camera.videoRef}
                muted
                playsInline
                className={`h-full w-full -scale-x-100 object-cover ${camera.active ? '' : 'invisible'}`}
              />
              {!camera.active && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <CameraOff className="h-10 w-10" />
                  <p className="text-sm">Camera is off</p>
                </div>
              )}
              {recognition.running && (
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Recognizing
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm text-slate-500">
                {camera.active ? 'One frame at a time, about one per second.' : 'Webcam for face recognition'}
              </p>
              {camera.active ? (
                <button
                  onClick={stop}
                  className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-900"
                >
                  <CameraOff className="h-5 w-5" /> Stop
                </button>
              ) : (
                <button
                  onClick={start}
                  className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700"
                >
                  <Camera className="h-5 w-5" /> Start camera
                </button>
              )}
            </div>
            {camera.error && <p className="mx-4 mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{camera.error}</p>}
          </section>

          <CaptionBox captions={captions} />
          <RecognitionPanel
            running={recognition.running}
            result={recognition.result}
            error={recognition.error}
            stats={recognition.stats}
          />
        </div>

        {/* Right: simulator and today's reminders */}
        <div className="space-y-4">
          <SimulatorPanel />

          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Pill className="h-4 w-4 text-sky-600" /> Today&apos;s reminders
            </h2>
            {activeReminders.length === 0 ? (
              <p className="text-sm text-slate-400">No active reminders. Add them on the More page.</p>
            ) : (
              <ul className="space-y-2">
                {activeReminders.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold tabular-nums text-slate-700">{r.time_of_day}</span>
                    <span className="text-slate-600">{r.text}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-400">Spoken aloud once when the clock reaches the time.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
