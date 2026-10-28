import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ConnectionMode } from '../config/dashboard'
import type { NTStatus } from './NT4Client'

/** Latest value of one topic, plus when it arrived (performance.now() ms). */
export interface TopicEntry {
  value: unknown
  type: string
  receivedAt: number
}

export interface ConnectionState {
  mode: ConnectionMode
  host: string
  status: NTStatus
}

/**
 * Tiny external store. Updates can arrive hundreds of times a second, so listeners are
 * notified at most once per animation frame.
 */
class DashboardStore {
  private entries = new Map<string, TopicEntry>()
  private connection: ConnectionState = { mode: 'sim', host: 'localhost', status: 'disconnected' }
  private listeners = new Set<() => void>()
  private frame = 0

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getEntry = (name: string) => this.entries.get(name)
  getConnection = () => this.connection

  setValue(name: string, type: string, value: unknown) {
    this.entries.set(name, { value, type, receivedAt: performance.now() })
    this.scheduleNotify()
  }

  setConnection(patch: Partial<ConnectionState>) {
    this.connection = { ...this.connection, ...patch }
    this.scheduleNotify()
  }

  clear() {
    this.entries.clear()
    this.scheduleNotify()
  }

  private scheduleNotify() {
    if (this.frame) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      this.listeners.forEach((l) => l())
    })
  }
}

export const store = new DashboardStore()

export function useTopic(name: string): TopicEntry | undefined {
  return useSyncExternalStore(store.subscribe, () => store.getEntry(name))
}

export function useConnection(): ConnectionState {
  return useSyncExternalStore(store.subscribe, store.getConnection)
}

/** Re-renders on an interval so stale checks and fading trails keep updating with no new data. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(performance.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
