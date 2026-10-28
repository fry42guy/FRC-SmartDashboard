import { useEffect, useRef } from 'react'
import { TRAIL_SECONDS } from '../config/dashboard'
import { FIELD, ROBOT } from '../config/field'
import type { Pose } from '../nt/structs'
import { RAD_TO_DEG } from '../util/angles'
import { Card, type DataState } from './Card'

interface FieldViewProps {
  pose: Pose | null
  state: DataState
  /** View from the red driver station (field rotated 180°). */
  redPerspective: boolean
  /** Bumper color. */
  allianceColor: string
  now: number
  className?: string
}

interface TrailPoint {
  x: number
  y: number
  t: number
}

const L = FIELD.lengthMeters
const W = FIELD.widthMeters

// Map image pixels to meters. Everything below is drawn in "screen meters": x right, y down,
// with field point (x, y) at screen (x, W - y) so blue-origin +Y points up.
const sx = L / (FIELD.fieldCorners.right - FIELD.fieldCorners.left)
const sy = W / (FIELD.fieldCorners.bottom - FIELD.fieldCorners.top)
const IMAGE = {
  x: -FIELD.fieldCorners.left * sx,
  y: -FIELD.fieldCorners.top * sy,
  width: FIELD.imageSize.width * sx,
  height: FIELD.imageSize.height * sy,
}
const IMAGE_HREF = `${import.meta.env.BASE_URL}${FIELD.image}`
/** A move this large between samples is a pose reset, not motion; restart the trail. */
const TRAIL_JUMP_M = 1.5

export function FieldView({ pose, state, redPerspective, allianceColor, now, className = '' }: FieldViewProps) {
  const trail = useRef<TrailPoint[]>([])

  useEffect(() => {
    if (!pose || state !== 'live') return
    const pts = trail.current
    const last = pts[pts.length - 1]
    if (last && Math.hypot(pose.x - last.x, pose.y - last.y) > TRAIL_JUMP_M) pts.length = 0
    pts.push({ x: pose.x, y: pose.y, t: performance.now() })
  }, [pose, state])

  const cutoff = now - TRAIL_SECONDS * 1000
  while (trail.current.length && trail.current[0].t < cutoff) trail.current.shift()
  const pts = trail.current

  return (
    <Card
      title={`Field · ${FIELD.name}`}
      state={state}
      className={className}
      bodyClassName="relative"
      dimWhenStale={false}
      aside={
        <span className="text-xs font-medium text-muted">
          {redPerspective ? 'Red' : 'Blue'} driver view
        </span>
      }
    >
      <svg
        className="absolute inset-0 h-full w-full p-2"
        viewBox={`${IMAGE.x} ${IMAGE.y} ${IMAGE.width} ${IMAGE.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Robot position on the field"
      >
        <g transform={redPerspective ? `rotate(180 ${L / 2} ${W / 2})` : undefined}>
          <image href={IMAGE_HREF} {...IMAGE} preserveAspectRatio="none" />

          {pts.slice(1).map((p, i) => {
            const prev = pts[i]
            const fade = Math.max(0, 1 - (now - p.t) / (TRAIL_SECONDS * 1000))
            return (
              <line
                key={p.t}
                x1={prev.x}
                y1={W - prev.y}
                x2={p.x}
                y2={W - p.y}
                stroke="#22d3ee"
                strokeWidth={0.09}
                strokeLinecap="round"
                opacity={fade * 0.9}
              />
            )
          })}

          {pose && (
            <g
              transform={`translate(${pose.x} ${W - pose.y}) rotate(${-pose.yaw * RAD_TO_DEG})`}
              opacity={state === 'live' ? 1 : 0.45}
            >
              <Robot color={allianceColor} />
            </g>
          )}
        </g>
      </svg>

      {!pose && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="rounded-lg bg-bg/80 px-4 py-2 text-lg font-medium text-muted">Waiting for pose…</span>
        </div>
      )}
    </Card>
  )
}

/** Robot outline in its own frame (meters, +x = front), centered on the origin. */
function Robot({ color }: { color: string }) {
  const l = ROBOT.lengthMeters
  const w = ROBOT.widthMeters
  const bumper = 0.11
  return (
    <>
      <rect x={-l / 2} y={-w / 2} width={l} height={w} rx={0.08} fill={color} stroke="#05080c" strokeWidth={0.03} />
      <rect
        x={-l / 2 + bumper}
        y={-w / 2 + bumper}
        width={l - 2 * bumper}
        height={w - 2 * bumper}
        rx={0.04}
        fill="#0d1218"
      />
      {/* Heading arrow */}
      <path
        d={`M ${l / 2 - bumper - 0.04} 0 L ${-l * 0.12} ${-w * 0.24} L ${-l * 0.02} 0 L ${-l * 0.12} ${w * 0.24} Z`}
        fill="#ffffff"
      />
    </>
  )
}
