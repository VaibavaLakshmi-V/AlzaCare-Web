import { NavLink } from 'react-router-dom'
import { Bell, House, Map, Menu, Users } from 'lucide-react'
import { useLiveData } from '../context/LiveDataContext'

const ITEMS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/alerts', label: 'Alerts', icon: Bell, badge: true },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/people', label: 'People', icon: Users },
  { to: '/more', label: 'More', icon: Menu },
]

export default function BottomNav() {
  const { unseenAlerts } = useLiveData()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md border-t border-slate-200 bg-white/95 backdrop-blur">
        <ul className="grid grid-cols-5">
          {ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 2} />
                      {badge && unseenAlerts > 0 && (
                        <span className="absolute -right-2 -top-1.5 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                          {unseenAlerts > 9 ? '9+' : unseenAlerts}
                        </span>
                      )}
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
