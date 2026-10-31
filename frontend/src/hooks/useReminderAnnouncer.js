import { useEffect, useRef, useState } from 'react'
import { getReminders } from '../api'

const RELOAD_MS = 60000 // fetch the reminder list every minute
const CHECK_MS = 10000 // compare with the clock often enough never to miss a minute

const pad = (n) => String(n).padStart(2, '0')

// Speaks each active reminder once when the clock reaches its HH:MM. Returns the reminder list.
export function useReminderAnnouncer(say) {
  const [reminders, setReminders] = useState([])
  const listRef = useRef([])
  const spoken = useRef(new Set()) // "<date> <HH:MM> <id>"

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`
      for (const r of listRef.current) {
        const key = `${now.toDateString()} ${hhmm} ${r.id}`
        if (r.active && r.time_of_day === hhmm && !spoken.current.has(key)) {
          spoken.current.add(key)
          say(`Reminder: ${r.text}`, 'reminder')
        }
      }
    }
    const load = () =>
      getReminders()
        .then((list) => {
          listRef.current = list
          setReminders(list)
          check()
        })
        .catch(() => {}) // keep the last list if the server is briefly unreachable

    load()
    const reloadTimer = setInterval(load, RELOAD_MS)
    const checkTimer = setInterval(check, CHECK_MS)
    return () => {
      clearInterval(reloadTimer)
      clearInterval(checkTimer)
    }
  }, [say])

  return reminders
}
