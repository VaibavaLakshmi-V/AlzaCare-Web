import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { RequireAuth } from './context/AuthContext'
import { LiveDataProvider } from './context/LiveDataContext'
import AlertsPage from './pages/AlertsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import MorePage from './pages/MorePage'
import PeoplePage from './pages/PeoplePage'
import StationPage from './pages/StationPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Everything below needs a token and shares the live data (REST + WebSocket) */}
      <Route
        element={
          <RequireAuth>
            <LiveDataProvider>
              <Outlet />
            </LiveDataProvider>
          </RequireAuth>
        }
      >
        {/* Full-width laptop page, outside the phone layout */}
        <Route path="station" element={<StationPage />} />
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="more" element={<MorePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
