import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

// Keeps the patient in view while `follow` is on; dragging the map turns it off
export default function MapFollower({ position, follow, onStopFollowing }) {
  const map = useMap()
  useMapEvents({ dragstart: onStopFollowing })

  const [lat, lng] = position ?? []
  useEffect(() => {
    if (follow && lat != null) map.panTo([lat, lng], { animate: true, duration: 0.9 })
  }, [follow, lat, lng, map])

  return null
}
