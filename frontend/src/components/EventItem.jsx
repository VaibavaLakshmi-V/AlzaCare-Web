import { memo } from 'react'
import { Camera, ChevronRight } from 'lucide-react'
import SourceBadge from './SourceBadge'
import { eventMeta, SEVERITY_STYLES } from '../utils/eventMeta'
import { timeAgo } from '../utils/time'

// One event row: type icon, label, message, time, source badge. Tappable when it has a snapshot.
// Memoized: the page re-renders every second for sensor data, rows only need to when their props change.
export default memo(function EventItem({ event, now, onOpenSnapshot }) {
  const { icon: Icon, label } = eventMeta(event.type)
  const style = SEVERITY_STYLES[event.severity] ?? SEVERITY_STYLES.info
  const hasSnapshot = Boolean(event.snapshot_path && onOpenSnapshot)

  const content = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-800">{label}</span>
          <SourceBadge source={event.source} />
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-slate-500">{event.message}</span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {style.label} · {timeAgo(event.created_at, now)}
          {hasSnapshot && (
            <span className="ml-1 inline-flex items-center gap-1 font-medium text-teal-600">
              <Camera className="h-3.5 w-3.5" /> Photo
            </span>
          )}
        </span>
      </span>
      {hasSnapshot && <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-300" />}
    </>
  )

  const className = 'flex w-full items-start gap-3 px-4 py-3 text-left'
  return hasSnapshot ? (
    <button onClick={() => onOpenSnapshot(event)} className={`${className} transition-colors hover:bg-slate-50`}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
})
