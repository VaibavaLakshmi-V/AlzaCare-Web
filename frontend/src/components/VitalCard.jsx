// Small card for one live value (heart rate, SpO2, battery)
export default function VitalCard({ icon: Icon, label, value, unit, alert = false, hint }) {
  return (
    <div className={`card p-3.5 ${alert ? 'ring-2 ring-red-400' : ''}`}>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${alert ? 'text-red-600' : 'text-slate-500'}`}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${alert ? 'text-red-600' : 'text-slate-800'}`}>
        {value ?? '—'}
        {value != null && <span className="ml-0.5 text-sm font-medium text-slate-400">{unit}</span>}
      </p>
      {hint && <p className={`text-xs ${alert ? 'text-red-500' : 'text-slate-400'}`}>{hint}</p>}
    </div>
  )
}
