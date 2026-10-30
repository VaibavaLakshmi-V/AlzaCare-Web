import { Heart } from 'lucide-react'

// Gradient app mark + "AlzaCare" wordmark
export default function Logo({ size = 'md' }) {
  const large = size === 'lg'
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-soft ${
          large ? 'h-14 w-14 rounded-2xl' : 'h-8 w-8 rounded-xl'
        }`}
      >
        <Heart className={large ? 'h-7 w-7' : 'h-4 w-4'} fill="currentColor" strokeWidth={0} />
      </div>
      <span className={`font-semibold tracking-tight ${large ? 'text-3xl' : 'text-lg'}`}>
        <span className="text-slate-800">Alza</span>
        <span className="text-teal-600">Care</span>
      </span>
    </div>
  )
}
