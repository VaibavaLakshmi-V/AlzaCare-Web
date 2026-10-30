// "SIMULATED" for simulator data, "LIVE" for real detections
export default function SourceBadge({ source }) {
  const simulated = source === 'simulated'
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${
        simulated ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {simulated ? 'SIMULATED' : 'LIVE'}
    </span>
  )
}
