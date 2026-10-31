// All backend access lives here. Using the page's hostname means the app also works
// when opened from a phone on the same network (e.g. http://192.168.1.20:5173).
export const API_BASE = `http://${window.location.hostname}:8000`
export const wsUrl = (token) => `ws://${window.location.hostname}:8000/ws?token=${encodeURIComponent(token)}`

const TOKEN_KEY = 'alzacare_token'
export const UNAUTHORIZED_EVENT = 'alzacare:unauthorized'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage blocked: the session just won't survive a reload
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function unreachable() {
  return new ApiError(`Can't reach the AlzaCare server at ${API_BASE}. Is the backend running?`, 0)
}

// Pull a readable message out of a FastAPI error response
async function errorMessage(res) {
  try {
    const body = await res.json()
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) return body.detail.map((d) => d.msg).join(', ')
  } catch {
    // not JSON
  }
  return `Request failed (${res.status})`
}

// Authenticated fetch. Any 401 clears the token and tells the app to go to the login screen.
export async function apiFetch(path, { method = 'GET', json, body, headers = {} } = {}) {
  const token = getToken()
  const init = { method, headers: { ...headers } }
  if (token) init.headers.Authorization = `Bearer ${token}`
  if (json !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(json)
  } else if (body !== undefined) {
    init.body = body
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, init)
  } catch {
    throw unreachable()
  }
  if (res.status === 401) {
    setToken(null)
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }
  if (!res.ok) throw new ApiError(await errorMessage(res), res.status)
  return res
}

const getJson = async (path) => (await apiFetch(path)).json()

// Login uses form data (OAuth2 password flow) and handles its own 401
export async function login(username, password) {
  let res
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: new URLSearchParams({ username, password }),
    })
  } catch {
    throw unreachable()
  }
  if (!res.ok) throw new ApiError(await errorMessage(res), res.status)
  return (await res.json()).access_token
}

const sendJson = async (path, method, json) => (await apiFetch(path, { method, json })).json()

export const getStatus = () => getJson('/status')
export const getEvents = (limit = 500) => getJson(`/events?limit=${limit}`)

// Patient profile
export const getPatient = () => getJson('/patient')
export const updatePatient = (data) => sendJson('/patient', 'PUT', data)

// Known people
export const getKnownPersons = () => getJson('/known-persons')
export const personPhotoPath = (id) => `/known-persons/${id}/photo`
export const deletePerson = (id) => apiFetch(`/known-persons/${id}`, { method: 'DELETE' })
export async function enrollPerson({ name, relationship, photo }) {
  const form = new FormData()
  form.append('name', name)
  form.append('relationship', relationship)
  form.append('photo', photo, photo.name || 'photo.jpg')
  return (await apiFetch('/known-persons', { method: 'POST', body: form })).json()
}

// Reminders
export const getReminders = () => getJson('/reminders')
export const createReminder = (data) => sendJson('/reminders', 'POST', data)
export const updateReminder = (id, data) => sendJson(`/reminders/${id}`, 'PUT', data)
export const deleteReminder = (id) => apiFetch(`/reminders/${id}`, { method: 'DELETE' })

// Simulator
export const getSimState = () => getJson('/sim/state')
export const setScenario = (scenario) => sendJson('/sim/scenario', 'POST', { scenario })

// Live face recognition: one JPEG frame in, faces + optional sentence to speak out
export async function recognizeFrame(blob) {
  const form = new FormData()
  form.append('frame', blob, 'frame.jpg')
  return (await apiFetch('/recognize', { method: 'POST', body: form })).json()
}

// Protected images (snapshots, photos) need the Bearer header, so fetch them as blobs
export async function fetchImageUrl(path) {
  const blob = await (await apiFetch(path)).blob()
  return URL.createObjectURL(blob)
}

export const uploadPath = (snapshotPath) => `/uploads/${snapshotPath.split('/').pop()}`
