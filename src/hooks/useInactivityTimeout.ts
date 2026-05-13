import { useEffect, useRef, useCallback } from 'react'

const INACTIVITY_MS = 15 * 60 * 1000 // 15 minutes

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const

export function useInactivityTimeout(onTimeout: () => void, timeoutMs = INACTIVITY_MS) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onTimeoutRef.current(), timeoutMs)
  }, [timeoutMs])

  useEffect(() => {
    EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, reset))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [reset])
}
