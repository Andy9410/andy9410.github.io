import { useEffect, useRef } from 'react'

const INACTIVITY_MS = 15 * 60 * 1000 // 15 minutes

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const

export function useInactivityTimeout(onTimeout: () => void, timeoutMs = INACTIVITY_MS) {
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  const lastActivityRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const idle = Date.now() - lastActivityRef.current
        if (idle >= timeoutMs) {
          onTimeoutRef.current()
        } else {
          // hubo actividad reciente, reprogramar por el tiempo restante
          timerRef.current = setTimeout(schedule, timeoutMs - idle)
        }
      }, timeoutMs)
    }

    const handleActivity = () => { lastActivityRef.current = Date.now() }

    EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }))
    schedule()

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, handleActivity))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeoutMs])
}
