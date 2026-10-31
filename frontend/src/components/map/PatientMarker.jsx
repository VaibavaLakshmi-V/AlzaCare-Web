import { useEffect, useMemo, useRef, useState } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import { patientIcon } from '../../utils/leaflet'

const GLIDE_MS = 900 // a little under the 1 s update interval

// Patient marker that glides to each new GPS position instead of jumping
export default function PatientMarker({ position, outside, name }) {
  const markerRef = useRef(null)
  const shown = useRef(position) // where the marker currently is
  const [initial] = useState(position) // react-leaflet only needs a starting point; we move it ourselves
  const icon = useMemo(() => patientIcon(outside), [outside])
  const [lat, lng] = position

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return undefined
    const [fromLat, fromLng] = shown.current
    const started = performance.now()
    let frame
    const step = (now) => {
      const t = Math.min(1, (now - started) / GLIDE_MS)
      const ease = 1 - (1 - t) ** 2
      shown.current = [fromLat + (lat - fromLat) * ease, fromLng + (lng - fromLng) * ease]
      marker.setLatLng(shown.current)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [lat, lng])

  return (
    <Marker ref={markerRef} position={initial} icon={icon} zIndexOffset={1000}>
      <Tooltip direction="top" offset={[0, -12]}>{name ?? 'Patient'}</Tooltip>
    </Marker>
  )
}
