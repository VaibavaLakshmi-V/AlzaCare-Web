import { useEffect } from 'react'
import { ImageOff, Loader2, X } from 'lucide-react'
import SourceBadge from './SourceBadge'
import { useAuthedImage } from '../hooks/useAuthedImage'
import { uploadPath } from '../api'
import { eventMeta } from '../utils/eventMeta'
import { formatDateTime } from '../utils/time'

// Full-screen sheet showing an event's camera snapshot (fetched with the token as a blob)
export default function SnapshotModal({ event, onClose }) {
  const { url, error, loading } = useAuthedImage(uploadPath(event.snapshot_path))

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-800">{eventMeta(event.type).label}</h2>
              <SourceBadge source={event.source} />
            </div>
            <p className="text-sm text-slate-500">{formatDateTime(event.created_at)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 p-2 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {loading && <Loader2 className="h-8 w-8 animate-spin text-slate-400" />}
          {error && (
            <div className="flex flex-col items-center gap-2 px-6 text-center text-sm text-slate-500">
              <ImageOff className="h-8 w-8" />
              {error}
            </div>
          )}
          {url && <img src={url} alt="Camera snapshot" className="h-full w-full object-contain" />}
        </div>
        <p className="mt-3 text-sm text-slate-600">{event.message}</p>
      </div>
    </div>
  )
}
