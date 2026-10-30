import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import * as api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(api.getToken)
  const navigate = useNavigate()

  const login = useCallback(async (username, password) => {
    const newToken = await api.login(username, password)
    api.setToken(newToken)
    setTokenState(newToken)
  }, [])

  const logout = useCallback(() => {
    api.setToken(null)
    setTokenState(null)
    navigate('/login', { replace: true })
  }, [navigate])

  // api.js fires this on any 401
  useEffect(() => {
    window.addEventListener(api.UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(api.UNAUTHORIZED_EVENT, logout)
  }, [logout])

  const value = useMemo(() => ({ token, login, logout }), [token, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

// Wrap private routes: no token -> login screen
export function RequireAuth({ children }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
