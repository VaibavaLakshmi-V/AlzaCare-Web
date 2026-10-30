import { useEffect, useState } from 'react'
import { fetchImageUrl } from '../api'

// Loads a JWT-protected image into a blob URL and revokes it when no longer needed
export function useAuthedImage(path) {
  const [state, setState] = useState({ url: null, error: null, loading: Boolean(path) })

  useEffect(() => {
    if (!path) return undefined
    let url
    let cancelled = false
    setState({ url: null, error: null, loading: true })
    fetchImageUrl(path)
      .then((u) => {
        url = u
        if (cancelled) URL.revokeObjectURL(u)
        else setState({ url: u, error: null, loading: false })
      })
      .catch((err) => !cancelled && setState({ url: null, error: err.message, loading: false }))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [path])

  return state
}
