import { useEffect, useRef } from 'react'

// What the patient hears when these alerts arrive live
export const ALERT_PROMPTS = {
  fall: 'Please stay where you are, help is coming.',
  geofence_exit: 'You are leaving the safe area, please come back home.',
  battery_low: 'Your watch battery is low. Please ask someone to charge it.',
}

// Speaks a short sentence for each new fall / geofence / battery event, once per event id
export function useAlertVoice(onLiveEvent, say) {
  const spoken = useRef(new Set())

  useEffect(
    () =>
      onLiveEvent((event) => {
        const text = ALERT_PROMPTS[event.type]
        if (!text || spoken.current.has(event.id)) return
        spoken.current.add(event.id)
        say(text, 'alert')
      }),
    [onLiveEvent, say],
  )
}
