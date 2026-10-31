import { useCallback, useEffect, useRef, useState } from 'react'
import { recognizeFrame } from '../api'
import { captureFrame } from '../utils/capture'

const FRAME_WIDTH = 320
const RETRY_MS = 2000
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Sends webcam frames to POST /recognize one at a time: the next frame goes only after the reply,
// so requests never pile up. Calls onSpeak(sentence) when the backend says to announce someone.
export function useRecognitionLoop(videoRef, onSpeak) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ frames: 0, lastMs: null })
  const generation = useRef(0) // bumps on start/stop so an old loop can never keep running
  const onSpeakRef = useRef(onSpeak)
  onSpeakRef.current = onSpeak

  const loop = useCallback(
    async (gen) => {
      const alive = () => generation.current === gen
      while (alive()) {
        const video = videoRef.current
        if (!video?.videoWidth) {
          await sleep(200) // camera still warming up
          continue
        }
        try {
          const blob = await captureFrame(video, FRAME_WIDTH)
          const started = performance.now()
          const res = await recognizeFrame(blob)
          if (!alive()) return
          setResult(res)
          setError(null)
          setStats((s) => ({ frames: s.frames + 1, lastMs: Math.round(performance.now() - started) }))
          if (res.speak) onSpeakRef.current(res.speak)
        } catch (err) {
          if (!alive()) return
          setError(err.message)
          await sleep(RETRY_MS)
        }
      }
    },
    [videoRef],
  )

  const start = useCallback(() => {
    const gen = ++generation.current
    setRunning(true)
    setResult(null)
    setError(null)
    loop(gen)
  }, [loop])

  const stop = useCallback(() => {
    generation.current += 1
    setRunning(false)
  }, [])

  useEffect(() => () => void (generation.current += 1), [])

  return { running, result, error, stats, start, stop }
}
