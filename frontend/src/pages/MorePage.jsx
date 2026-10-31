import { Link } from 'react-router-dom'
import { ChevronRight, LogOut, MonitorSmartphone } from 'lucide-react'
import PatientProfile from '../components/more/PatientProfile'
import RemindersSection from '../components/more/RemindersSection'
import { useAuth } from '../context/AuthContext'
import { useLiveData } from '../context/LiveDataContext'
import { API_BASE } from '../api'

export default function MorePage() {
  const { logout } = useAuth()
  const { patient, refresh } = useLiveData()

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-xl font-semibold text-slate-800">More</h1>

      <Link
        to="/station"
        className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-teal-600 to-sky-700 p-5 text-white shadow-lg shadow-teal-700/20"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <MonitorSmartphone className="h-6 w-6" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Patient station</span>
          <span className="block text-sm text-teal-50">Webcam recognition, voice and the sensor simulator (laptop)</span>
        </span>
        <ChevronRight className="h-5 w-5" />
      </Link>

      {/* refresh() reloads the patient everywhere (Home, Map) after saving */}
      <PatientProfile patient={patient} onSaved={refresh} />
      <RemindersSection />

      <section className="card divide-y divide-slate-100">
        <p className="px-5 py-3 text-sm text-slate-500">
          Server <span className="font-mono text-slate-700">{API_BASE}</span>
        </p>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-b-2xl px-5 py-3.5 text-left font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" /> Sign out
        </button>
      </section>
    </div>
  )
}
