import { useEffect, useRef, useState } from 'react'
import { DASHBOARD_TITLE, type ConnectionMode } from '../config/dashboard'
import { useConnection } from '../nt/store'
import { teamToIp, type ConnectionSettings } from '../nt/settings'

export type Perspective = 'auto' | 'blue' | 'red'

interface HeaderProps {
  settings: ConnectionSettings
  onSettingsChange: (s: ConnectionSettings) => void
  perspective: Perspective
  onPerspectiveChange: (p: Perspective) => void
  /** Alliance currently in effect (after resolving "auto"). */
  isRed: boolean
}

export function Header({ settings, onSettingsChange, perspective, onPerspectiveChange, isRed }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-panel/60 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 12h4l3-8 4 16 3-8h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold tracking-tight">
          {DASHBOARD_TITLE}
          {settings.mode === 'team' && <span className="ml-2 font-normal text-muted">Team {settings.team}</span>}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Segmented
          label="Alliance view"
          value={perspective}
          onChange={onPerspectiveChange}
          options={[
            { value: 'auto', label: `Auto · ${isRed ? 'Red' : 'Blue'}` },
            { value: 'blue', label: 'Blue' },
            { value: 'red', label: 'Red' },
          ]}
        />
        <ConnectionButton settings={settings} onSettingsChange={onSettingsChange} />
      </div>
    </header>
  )
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-line bg-bg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === o.value ? 'bg-panel-2 text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const STATUS_STYLE = {
  connected: { dot: 'bg-ok', text: 'Connected' },
  connecting: { dot: 'bg-warn animate-pulse', text: 'Connecting…' },
  disconnected: { dot: 'bg-bad', text: 'Disconnected' },
} as const

const MODE_LABELS: Record<ConnectionMode, string> = { team: 'Team #', ip: 'IP', sim: 'Sim', mock: 'Mock' }

function ConnectionButton({
  settings,
  onSettingsChange,
}: {
  settings: ConnectionSettings
  onSettingsChange: (s: ConnectionSettings) => void
}) {
  const conn = useConnection()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(settings)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const style = conn.mode === 'mock' ? { dot: 'bg-violet-400', text: 'Mock data' } : STATUS_STYLE[conn.status]

  const apply = () => {
    onSettingsChange(draft)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setDraft(settings)
          setOpen((o) => !o)
        }}
        className="flex items-center gap-2.5 rounded-lg border border-line bg-bg px-3 py-1.5 hover:border-dim"
      >
        <span className={`size-2.5 rounded-full ${style.dot}`} />
        <span className="text-sm font-semibold">{style.text}</span>
        {conn.mode !== 'mock' && <span className="font-mono text-sm text-muted">{conn.host}</span>}
        <svg viewBox="0 0 20 20" className="size-4 text-dim" fill="currentColor">
          <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth={1.5} fill="none" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-line bg-panel-2 p-4 shadow-2xl shadow-black/60">
          <div className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted uppercase">Robot connection</div>
          <Segmented
            label="Connection mode"
            value={draft.mode}
            onChange={(mode) => setDraft({ ...draft, mode })}
            options={(Object.keys(MODE_LABELS) as ConnectionMode[]).map((m) => ({ value: m, label: MODE_LABELS[m] }))}
          />

          <div className="mt-4 min-h-[68px] text-sm">
            {draft.mode === 'team' && (
              <label className="block">
                <span className="text-muted">Team number</span>
                <input
                  type="number"
                  min={1}
                  max={25599}
                  value={draft.team || ''}
                  onChange={(e) => setDraft({ ...draft, team: Number(e.target.value) })}
                  onKeyDown={(e) => e.key === 'Enter' && apply()}
                  className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 font-mono text-base text-ink outline-none focus:border-accent"
                  autoFocus
                />
                <span className="mt-1 block font-mono text-xs text-dim">→ {teamToIp(draft.team || 0)}:5810</span>
              </label>
            )}
            {draft.mode === 'ip' && (
              <label className="block">
                <span className="text-muted">Robot address</span>
                <input
                  value={draft.ip}
                  onChange={(e) => setDraft({ ...draft, ip: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && apply()}
                  placeholder="10.31.34.2"
                  className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 font-mono text-base text-ink outline-none focus:border-accent"
                  autoFocus
                />
              </label>
            )}
            {draft.mode === 'sim' && (
              <p className="text-muted">
                WPILib desktop simulation on <span className="font-mono text-ink">localhost:5810</span>.
              </p>
            )}
            {draft.mode === 'mock' && (
              <p className="text-muted">Animated fake pose and arm data. No robot needed.</p>
            )}
          </div>

          <button
            onClick={apply}
            className="mt-3 w-full rounded-md bg-accent py-2 text-sm font-semibold text-bg hover:bg-accent/90"
          >
            Connect
          </button>
        </div>
      )}
    </div>
  )
}
