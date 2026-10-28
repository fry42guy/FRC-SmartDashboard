import { CONNECTION_DEFAULTS, type ConnectionMode } from '../config/dashboard'

export interface ConnectionSettings {
  mode: ConnectionMode
  team: number
  ip: string
}

const STORAGE_KEY = 'frc-dashboard.connection'
const MODES: ConnectionMode[] = ['team', 'ip', 'sim', 'mock']

/** Team 3134 -> 10.31.34.2, team 254 -> 10.2.54.2. */
export function teamToIp(team: number): string {
  return `10.${Math.floor(team / 100)}.${team % 100}.2`
}

export function resolveHost(s: ConnectionSettings): string {
  if (s.mode === 'team') return teamToIp(s.team)
  if (s.mode === 'ip') return s.ip.trim()
  return 'localhost'
}

/**
 * Defaults from config, then whatever was saved last time, then URL overrides
 * (?mode=mock, ?team=3134, ?host=10.31.34.2) so a bookmark can pin a setup.
 */
export function loadSettings(): ConnectionSettings {
  let settings: ConnectionSettings = {
    mode: CONNECTION_DEFAULTS.mode,
    team: CONNECTION_DEFAULTS.team,
    ip: CONNECTION_DEFAULTS.ip,
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved && MODES.includes(saved.mode)) settings = { ...settings, ...saved }
  } catch {
    // storage unavailable; use defaults
  }

  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode') as ConnectionMode | null
  const team = Number(params.get('team'))
  const host = params.get('host')
  if (host) settings = { ...settings, mode: 'ip', ip: host }
  if (team > 0) settings = { ...settings, mode: 'team', team }
  if (mode && MODES.includes(mode)) settings = { ...settings, mode }
  return settings
}

export function saveSettings(s: ConnectionSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // storage unavailable; settings just won't persist
  }
}
