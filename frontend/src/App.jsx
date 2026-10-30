import { Navigate, Route, Routes } from 'react-router-dom'
import { Map, Users } from 'lucide-react'
import AppShell from './components/AppShell'
import { RequireAuth } from './context/AuthContext'
import { LiveDataProvider } from './context/LiveDataContext'
import AlertsPage from './pages/AlertsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MorePage from './pages/MorePage'
import PlaceholderPage from './pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <LiveDataProvider>
              <AppShell />
            </LiveDataProvider>
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route
          path="map"
          element={<PlaceholderPage icon={Map} title="Map" description="Live location and the safe zone" />}
        />
        <Route
          path="people"
          element={<PlaceholderPage icon={Users} title="People" description="Family and friends the patient knows" />}
        />
        <Route path="more" element={<MorePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
