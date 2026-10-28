import type { ReactNode } from 'react'

export type DataState = 'live' | 'stale' | 'none'

interface CardProps {
  title: ReactNode
  state?: DataState
  /** Extra content on the right of the title row. */
  aside?: ReactNode
  className?: string
  bodyClassName?: string
  /** Fade the body when data isn't live. Off for widgets that dim only part of themselves. */
  dimWhenStale?: boolean
  children: ReactNode
}

/** Shared panel. Dims its content and shows a badge when the data behind it is stale or missing. */
export function Card({
  title,
  state = 'live',
  aside,
  className = '',
  bodyClassName = '',
  dimWhenStale = true,
  children,
}: CardProps) {
  const border = state === 'stale' ? 'border-warn/70' : 'border-line'
  const dim = dimWhenStale && state !== 'live'
  return (
    <section className={`flex min-h-0 flex-col rounded-xl border bg-panel ${border} ${className}`}>
      <header className="flex items-center gap-2 px-4 pt-3 pb-1">
        <h2 className="text-[13px] font-semibold tracking-[0.08em] text-muted uppercase">{title}</h2>
        <div className="ml-auto flex items-center gap-2">
          {aside}
          {state === 'stale' && <Badge className="bg-warn/15 text-warn">Stale</Badge>}
          {state === 'none' && <Badge className="bg-white/5 text-dim">No data</Badge>}
        </div>
      </header>
      <div
        className={`min-h-0 flex-1 transition-opacity duration-200 ${dim ? 'opacity-40' : ''} ${bodyClassName}`}
      >
        {children}
      </div>
    </section>
  )
}

export function Badge({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ${className}`}>
      {children}
    </span>
  )
}

export function dataState(receivedAt: number | undefined, now: number, staleMs: number): DataState {
  if (receivedAt === undefined) return 'none'
  return now - receivedAt > staleMs ? 'stale' : 'live'
}
