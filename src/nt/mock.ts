import { FIELD } from '../config/field'
import { TOPICS } from '../config/topics'
import { shortestDelta, wrap360 } from '../util/angles'

type Emit = (name: string, type: string, value: unknown) => void

/**
 * Animated fake data for building the UI without a robot. Values are emitted already decoded,
 * exactly as the NT4 path delivers them to the store.
 */
export function startMock(emit: Emit): () => void {
  const start = performance.now()
  let last = start
  const cx = FIELD.lengthMeters / 2
  const cy = FIELD.widthMeters / 2
  const joints = [0, 90, 0]

  const tick = () => {
    const now = performance.now()
    const t = (now - start) / 1000
    const dt = (now - last) / 1000
    last = now

    // Figure-eight (lemniscate) across the field, heading along the path.
    const s = t * 0.35
    const px = (a: number) => cx + 5.5 * Math.cos(a)
    const py = (a: number) => cy + 2.6 * Math.sin(2 * a)
    const yaw = Math.atan2(py(s + 0.01) - py(s), px(s + 0.01) - px(s))
    emit(TOPICS.pose3d, 'struct:Pose3d', {
      x: px(s),
      y: py(s),
      z: 0.02 * Math.sin(t * 3),
      roll: 0.03 * Math.sin(t * 1.7),
      pitch: 0.04 * Math.cos(t * 1.3),
      yaw,
    })

    // Joint 1's setpoint spins continuously (exercises the 360 -> 0 wrap), joint 2 steps between
    // presets, joint 3 steps back and forth across 0°. Each joint chases its setpoint with some lag.
    const step = Math.floor(t / 3)
    const setpoints = [wrap360(t * 45), [45, 135, 90][step % 3], [0, 25, 330][step % 3]]
    TOPICS.arm.forEach((topic, i) => {
      joints[i] = wrap360(joints[i] + shortestDelta(joints[i], setpoints[i]) * Math.min(1, dt * 4))
      emit(topic.angle, 'double', joints[i])
      emit(topic.setpoint, 'double', setpoints[i])
    })
  }

  tick()
  const id = window.setInterval(tick, 20)
  return () => window.clearInterval(id)
}
