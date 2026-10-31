import { Camera, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import { captureFrame } from '../../utils/capture'

// Webcam preview with a "Take photo" button; hands back a full-size JPEG File
export default function CameraCapture({ onCapture }) {
  const camera = useCamera()
  const [busy, setBusy] = useState(false)

  const take = async () => {
    setBusy(true)
    try {
      const blob = await captureFrame(camera.videoRef.current, null, 0.92)
      camera.stop()
      onCapture(new File([blob], 'webcam.jpg', { type: 'image/jpeg' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900">
        <video
          ref={camera.videoRef}
          muted
          playsInline
          className={`h-full w-full -scale-x-100 object-cover ${camera.active ? '' : 'invisible'}`}
        />
        {!camera.active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={camera.start}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
            >
              <Camera className="h-5 w-5" /> Open camera
            </button>
          </div>
        )}
      </div>
      {camera.error && <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{camera.error}</p>}
      {camera.active && (
        <button
          type="button"
          onClick={take}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 font-semibold text-white hover:bg-slate-900"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />} Take photo
        </button>
      )}
    </div>
  )
}
