import { STALE_MS } from '../config/dashboard'
import { TOPICS } from '../config/topics'
import { useTopic } from '../nt/store'
import { isPose, type Pose } from '../nt/structs'

export interface PoseReading {
  pose: Pose
  source: 'Pose3d' | 'Pose2d'
  receivedAt: number
}

/** Live pose: Pose3d while it is fresh, otherwise whichever pose topic updated most recently. */
export function usePose(): PoseReading | null {
  const p3 = useTopic(TOPICS.pose3d)
  const p2 = useTopic(TOPICS.pose2d)

  const r3 = p3 && isPose(p3.value) ? { pose: p3.value, source: 'Pose3d' as const, receivedAt: p3.receivedAt } : null
  const r2 = p2 && isPose(p2.value) ? { pose: p2.value, source: 'Pose2d' as const, receivedAt: p2.receivedAt } : null

  if (r3 && (!r2 || r3.receivedAt >= r2.receivedAt - STALE_MS)) return r3
  return r2 ?? r3
}
