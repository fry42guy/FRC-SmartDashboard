import { useEffect, useRef, useState } from 'react'
import { shortestDelta, wrap360 } from '../util/angles'

/** Smoothing time constant in seconds. Small enough to feel live, large enough to hide 20 ms steps. */
const TAU_S = 0.06

/**
 * Eases a 0–360° value toward its target every animation frame, always along the shorter way
 * around, so 359° -> 1° moves 2° forward instead of spinning back 358°.
 */
export function useAnimatedAngle(target: number | null): number | null {
  const [display, setDisplay] = useState(target)
  const targetRef = useRef(target)
  const currentRef = useRef(target)

  useEffect(() => {
    targetRef.current = target
  }, [target])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const t = targetRef.current
      let next: number | null
      if (t === null || currentRef.current === null) {
        next = t
      } else {
        const delta = shortestDelta(currentRef.current, t)
        next = Math.abs(delta) < 0.01 ? t : wrap360(currentRef.current + delta * (1 - Math.exp(-dt / TAU_S)))
      }
      currentRef.current = next
      setDisplay(next)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return display
}
