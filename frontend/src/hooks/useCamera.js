import { useCallback, useEffect, useRef, useState } from 'react'

function cameraErrorMessage(err) {
  switch (err.name) {
    case 'NotAllowedError':
      return 'Camera permission is blocked. Click the camera icon in the address bar, allow access, then press Start again.'
    case 'NotFoundError':
      return 'No camera was found on this device.'
    case 'NotReadableError':
      return 'The camera is being used by another app. Close it and try again.'
    default:
      return `Could not start the camera: ${err.message}`
  }
}

// Webcam via getUserMedia. Attach videoRef to a <video>; the camera is released on stop or unmount.
export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      // Browsers only expose the camera on https or localhost
      setError('The camera is only available on https or http://localhost. Open the app on this computer at http://localhost:5173.')
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setActive(true)
      return true
    } catch (err) {
      setError(cameraErrorMessage(err))
      return false
    }
  }, [])

  useEffect(() => stop, [stop])

  return { videoRef, active, error, start, stop }
}
