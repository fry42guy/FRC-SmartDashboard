/** General dashboard settings: labels, timing, and connection defaults. */

export const DASHBOARD_TITLE = 'Robot Dashboard'

export type ConnectionMode = 'team' | 'ip' | 'sim' | 'mock'

export const CONNECTION_DEFAULTS = {
  /** Mode used the first time the dashboard opens (later choices are remembered). */
  mode: 'sim' as ConnectionMode,
  team: 3134,
  ip: '10.31.34.2',
  port: 5810,
}

/** A value is "stale" when nothing has arrived for this long. */
export const STALE_MS = 500

/** How many seconds of path to draw behind the robot. */
export const TRAIL_SECONDS = 3

/**
 * Arm dial setup, in the same order as TOPICS.arm.
 * zeroAtDeg: where 0° sits on the dial in math convention (0 = right, 90 = top).
 * direction: 'ccw' matches WPILib angles; use 'cw' for a clock-style dial.
 */
export const ARM_JOINTS = [
  { label: 'Joint 1', color: '#22d3ee', zeroAtDeg: 0, direction: 'ccw' },
  { label: 'Joint 2', color: '#a78bfa', zeroAtDeg: 0, direction: 'ccw' },
  { label: 'Joint 3', color: '#fb923c', zeroAtDeg: 0, direction: 'ccw' },
] as const satisfies readonly {
  label: string
  color: string
  zeroAtDeg: number
  direction: 'ccw' | 'cw'
}[]
