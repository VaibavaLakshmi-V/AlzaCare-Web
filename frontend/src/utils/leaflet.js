import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// Vite fingerprints asset URLs, so Leaflet can't find its default marker images by itself
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// Pulsing dot for the patient (styles in index.css)
export const patientIcon = (outside) =>
  L.divIcon({
    className: '',
    html: `<span class="patient-marker${outside ? ' patient-marker--outside' : ''}"><span></span></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

export const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
