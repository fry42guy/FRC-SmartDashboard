import type { PoseReading } from '../hooks/usePose'
import { RAD_TO_DEG, wrap180 } from '../util/angles'
import { Badge, Card, type DataState } from './Card'

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">{label}</div>
      <div className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-mono text-[clamp(1.75rem,2.6vw,3rem)] leading-tight font-semibold text-ink tabular-nums">
          {value}
        </span>
        <span className="text-base text-dim">{unit}</span>
      </div>
    </div>
  )
}

export function PoseCard({ reading, state, className = '' }: { reading: PoseReading | null; state: DataState; className?: string }) {
  const p = reading?.pose
  const fmt = (v: number | undefined, digits: number) => (v === undefined ? '--' : v.toFixed(digits))
  const deg = (rad: number | undefined) => (rad === undefined ? undefined : wrap180(rad * RAD_TO_DEG))

  return (
    <Card
      title="Pose"
      state={state}
      className={className}
      aside={reading && <Badge className="bg-white/5 text-muted normal-case">{reading.source}</Badge>}
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 pt-1 pb-4 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <Stat label="X" value={fmt(p?.x, 2)} unit="m" />
        <Stat label="Y" value={fmt(p?.y, 2)} unit="m" />
        <Stat label="Z" value={fmt(p?.z, 2)} unit="m" />
        <Stat label="Heading" value={fmt(deg(p?.yaw), 1)} unit="°" />
        <div className="col-span-2 flex gap-6 self-end font-mono text-sm text-muted tabular-nums sm:col-span-1 sm:flex-col sm:gap-1 sm:border-l sm:border-line sm:pl-5">
          <span>
            <span className="text-dim">Roll </span>
            {fmt(deg(p?.roll), 1)}°
          </span>
          <span>
            <span className="text-dim">Pitch </span>
            {fmt(deg(p?.pitch), 1)}°
          </span>
        </div>
      </div>
    </Card>
  )
}
