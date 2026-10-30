// Same limits as the backend detectors (backend/app/config.py), used to colour the vital cards
export const HEART_RATE_HIGH = 120
export const HEART_RATE_LOW = 45
export const SPO2_LOW = 92
export const BATTERY_LOW = 15

// Home shows "ALERT" while a critical event is newer than this
export const RECENT_CRITICAL_MS = 10 * 60 * 1000
