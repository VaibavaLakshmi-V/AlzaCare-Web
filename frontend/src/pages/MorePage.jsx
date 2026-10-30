import { LogOut, Menu } from 'lucide-react'
import PlaceholderPage from './PlaceholderPage'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../api'

// Settings arrive in part B; sign out is needed now
export default function MorePage() {
  const { logout } = useAuth()
  return (
    <PlaceholderPage icon={Menu} title="More" description="Reminders, simulator controls and settings">
      <div className="card mt-4 divide-y divide-slate-100">
        <p className="px-4 py-3 text-sm text-slate-500">
          Server <span className="font-mono text-slate-700">{API_BASE}</span>
        </p>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" /> Sign out
        </button>
      </div>
    </PlaceholderPage>
  )
}
