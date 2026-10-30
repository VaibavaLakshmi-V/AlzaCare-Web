import { useNavigate } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import { useLiveData } from '../context/LiveDataContext'
import { eventMeta } from '../utils/eventMeta'

// Red banner across the top for 8 s when a critical event arrives live
export default function CriticalBanner() {
  const { banner, dismissBanner } = useLiveData()
  const navigate = useNavigate()
  if (!banner) return null

  const open = () => {
    dismissBanner()
    navigate('/alerts')
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-md px-3 pt-3">
        <div
          role="alert"
          className="flex animate-slide-down items-start gap-3 rounded-2xl bg-red-600 p-4 text-white shadow-lg shadow-red-600/30"
        >
          <button onClick={open} className="flex flex-1 items-start gap-3 text-left">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 animate-pulse" />
            <span>
              <span className="block text-sm font-bold uppercase tracking-wide">
                {eventMeta(banner.type).label}
              </span>
              <span className="block text-sm text-red-50">{banner.message}</span>
            </span>
          </button>
          <button onClick={dismissBanner} aria-label="Dismiss" className="rounded-full p-1 hover:bg-white/15">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
