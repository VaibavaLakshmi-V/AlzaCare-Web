import { useRef, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import { House, LocateFixed, MapPinOff, ShieldAlert, ShieldCheck } from 'lucide-react'
import MapFollower from '../components/map/MapFollower'
import PatientMarker from '../components/map/PatientMarker'
import { useLiveData } from '../context/LiveDataContext'
import { OSM_ATTRIBUTION, OSM_TILES } from '../utils/leaflet'
import { formatDistance } from '../utils/time'

export default function MapPage() {
  const { patient, reading, inSafeZone, distance } = useLiveData()
  const [follow, setFollow] = useState(true)
  const mapRef = useRef(null)

  const home = patient?.home_lat != null && patient?.home_lng != null ? [patient.home_lat, patient.home_lng] : null
  const position = reading ? [reading.lat, reading.lng] : null
  const outside = inSafeZone === false

  const showHome = () => {
    setFollow(false)
    if (home) mapRef.current?.setView(home, 16, { animate: true })
  }

  if (!patient) return <p className="px-1 text-sm text-slate-400">Loading map…</p>

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h1 className="text-xl font-semibold text-slate-800">Map</h1>
        {inSafeZone != null && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
              outside ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {outside ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {outside ? 'Outside' : 'Inside safe zone'} · {formatDistance(distance)}
          </span>
        )}
      </div>

      {!home ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center text-slate-500">
          <MapPinOff className="h-10 w-10 text-slate-400" />
          <p className="text-sm">No home location set. Add it under More → Patient profile.</p>
        </div>
      ) : (
        // isolate: keeps Leaflet's high z-indexes below the app's header and bottom bar
        <div className="card relative isolate h-[62vh] min-h-[340px] overflow-hidden">
          <MapContainer ref={mapRef} center={position ?? home} zoom={16} className="h-full w-full" zoomControl={false}>
            <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={19} />
            <Circle
              center={home}
              radius={patient.safe_radius_m}
              pathOptions={{ color: '#0d9488', weight: 2, fillColor: '#14b8a6', fillOpacity: 0.12 }}
            />
            <Marker position={home}>
              <Tooltip direction="top">Home · safe radius {patient.safe_radius_m} m</Tooltip>
            </Marker>
            {position && <PatientMarker position={position} outside={outside} name={patient.name} />}
            <MapFollower position={position} follow={follow} onStopFollowing={() => setFollow(false)} />
          </MapContainer>

          <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-2">
            <button
              onClick={showHome}
              aria-label="Show home"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-soft hover:bg-slate-50"
            >
              <House className="h-5 w-5" />
            </button>
            <button
              onClick={() => setFollow(true)}
              aria-label="Follow patient"
              className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-soft ${
                follow ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LocateFixed className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-white bg-teal-600 shadow" /> Patient (live)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-teal-600 bg-teal-500/20" /> Safe zone ({patient.safe_radius_m} m)
        </span>
        <span>{follow ? 'Following the patient' : 'Tap the target to follow again'}</span>
      </div>
    </div>
  )
}
