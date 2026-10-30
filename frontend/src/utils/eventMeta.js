import {
  Activity, BatteryLow, BellRing, HeartPulse, House, MapPinOff, MessageSquareText, PersonStanding,
  UserCheck, UserX, Wind,
} from 'lucide-react'

// Icon and short label per event type
const TYPES = {
  fall: { icon: PersonStanding, label: 'Fall' },
  geofence_exit: { icon: MapPinOff, label: 'Left safe zone' },
  geofence_return: { icon: House, label: 'Back in safe zone' },
  heart_rate_high: { icon: HeartPulse, label: 'High heart rate' },
  heart_rate_low: { icon: HeartPulse, label: 'Low heart rate' },
  spo2_low: { icon: Wind, label: 'Low oxygen' },
  battery_low: { icon: BatteryLow, label: 'Low battery' },
  face_known: { icon: UserCheck, label: 'Known person' },
  face_unknown: { icon: UserX, label: 'Unknown person' },
  sms: { icon: MessageSquareText, label: 'SMS sent' },
  test: { icon: BellRing, label: 'Test alert' },
}

export function eventMeta(type) {
  return TYPES[type] ?? { icon: Activity, label: type.replace(/_/g, ' ') }
}

// Tailwind classes per severity
export const SEVERITY_STYLES = {
  critical: { icon: 'bg-red-100 text-red-600', dot: 'bg-red-500', text: 'text-red-600', label: 'Critical' },
  warning: { icon: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500', text: 'text-amber-600', label: 'Warning' },
  info: { icon: 'bg-teal-50 text-teal-600', dot: 'bg-teal-500', text: 'text-teal-600', label: 'Info' },
}

// Alerts = warning/critical events, not the SMS log entries that echo them
export const isAlert = (e) => (e.severity === 'warning' || e.severity === 'critical') && e.type !== 'sms'
