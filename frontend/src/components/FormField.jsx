// Labelled input used by the People and More forms
export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15'

export default function FormField({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}
