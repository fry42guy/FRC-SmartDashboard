import { useAnimatedAngle } from '../hooks/useAnimatedAngle'
import { Card, type DataState } from './Card'

interface ArmDialProps {
  label: string
  color: string
  /** Current angle in degrees, 0–360. */
  angle: number | null
  /** Optional target angle in degrees, drawn as a ghost needle. */
  setpoint: number | null
  state: DataState
  /** Where 0° sits on the dial, math convention (0 = right, 90 = top). */
  zeroAtDeg: number
  direction: 'ccw' | 'cw'
  className?: string
}

const C = 100
const RING_R = 76
const MAJOR_TICKS = Array.from({ length: 12 }, (_, i) => i * 30)
const MINOR_TICKS = Array.from({ length: 36 }, (_, i) => i * 10).filter((a) => a % 30 !== 0)
const LABELS = [0, 90, 180, 270]

export function ArmDial({ label, color, angle, setpoint, state, zeroAtDeg, direction, className = '' }: ArmDialProps) {
  const shown = useAnimatedAngle(angle)
  const ghost = useAnimatedAngle(setpoint)
  const dir = direction === 'ccw' ? 1 : -1

  /** Point at radius r for dial angle a (degrees), in SVG coordinates. */
  const at = (r: number, a: number): [number, number] => {
    const m = ((zeroAtDeg + dir * a) * Math.PI) / 180
    return [C + r * Math.cos(m), C - r * Math.sin(m)]
  }
  const line = (r1: number, r2: number, a: number) => {
    const [x1, y1] = at(r1, a)
    const [x2, y2] = at(r2, a)
    return { x1, y1, x2, y2 }
  }

  let arc = ''
  if (shown !== null && shown > 0.05) {
    const end = Math.min(shown, 359.9)
    const [x0, y0] = at(RING_R, 0)
    const [x1, y1] = at(RING_R, end)
    // SVG sweep-flag 1 is clockwise on screen; a counter-clockwise dial sweeps with 0.
    arc = `M ${x0} ${y0} A ${RING_R} ${RING_R} 0 ${end > 180 ? 1 : 0} ${dir === 1 ? 0 : 1} ${x1} ${y1}`
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: color }} />
          {label}
        </span>
      }
      state={state}
      className={className}
      bodyClassName="relative min-h-[140px]"
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full p-2" role="img" aria-label={`${label} angle`}>
        {/* Track and ticks */}
        <circle cx={C} cy={C} r={RING_R} fill="none" stroke="#1b2430" strokeWidth={12} />
        {MINOR_TICKS.map((a) => (
          <line key={a} {...line(88, 92, a)} stroke="#3a4656" strokeWidth={1} />
        ))}
        {MAJOR_TICKS.map((a) => (
          <line key={a} {...line(86, 94, a)} stroke="#6b7889" strokeWidth={2} />
        ))}
        {LABELS.map((a) => {
          const [x, y] = at(62, a)
          return (
            <text key={a} x={x} y={y} fill="#6b7889" fontSize={10} fontWeight={600} textAnchor="middle" dominantBaseline="central">
              {a}
            </text>
          )
        })}

        {/* Value arc from 0° */}
        {arc && <path d={arc} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" opacity={0.9} />}

        {/* Ghost needle for the setpoint */}
        {ghost !== null && (
          <g opacity={0.7}>
            <line {...line(68, 84, ghost)} stroke="#ffffff" strokeWidth={2.5} strokeDasharray="3 3" />
            <path d={triangle(at, ghost)} fill="#ffffff" />
          </g>
        )}

        {/* Needle */}
        {shown !== null && (
          <>
            <line {...line(68, 88, shown)} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" />
            <circle cx={at(RING_R, shown)[0]} cy={at(RING_R, shown)[1]} r={4} fill={color} stroke="#ffffff" strokeWidth={2} />
          </>
        )}

        {/* Readout */}
        <text
          x={C}
          y={setpoint !== null ? 96 : 100}
          fill="#e8eef5"
          fontSize={26}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono tabular-nums"
        >
          {angle === null ? '--' : angle.toFixed(1)}
          <tspan fontSize={14} fill="#8b98a9" dy={-7}>
            °
          </tspan>
        </text>
        {setpoint !== null && (
          <text x={C} y={122} fill="#8b98a9" fontSize={11} fontWeight={600} textAnchor="middle" className="font-mono tabular-nums">
            SP {setpoint.toFixed(1)}°
          </text>
        )}
      </svg>
    </Card>
  )
}

/** Small inward-pointing triangle just outside the ring, marking the setpoint. */
function triangle(at: (r: number, a: number) => [number, number], a: number) {
  const tip = at(84, a)
  const left = at(98, a - 4)
  const right = at(98, a + 4)
  return `M ${tip[0]} ${tip[1]} L ${left[0]} ${left[1]} L ${right[0]} ${right[1]} Z`
}
