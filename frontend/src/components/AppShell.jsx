import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import CriticalBanner from './CriticalBanner'
import Logo from './Logo'
import { useLiveData } from '../context/LiveDataContext'

// Phone-width column: top bar, scrolling page content, fixed bottom navigation
export default function AppShell() {
  const { connected } = useLiveData()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 shadow-xl shadow-slate-300/40">
      <CriticalBanner />
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
        <div className="flex items-center justify-between">
          <Logo />
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              connected ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-teal-500' : 'bg-slate-400'}`} />
            {connected ? 'Live' : 'Connecting…'}
          </span>
        </div>
      </header>
      <main className="flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
