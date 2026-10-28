import { CONNECTION_DEFAULTS } from '../config/dashboard'
import { ALL_TOPICS } from '../config/topics'
import { NT4Client } from './NT4Client'
import { startMock } from './mock'
import { resolveHost, type ConnectionSettings } from './settings'
import { store } from './store'
import { decodeValue } from './structs'

/** Starts feeding the store from the robot (or mock data). Returns a function that stops it. */
export function startDataSource(settings: ConnectionSettings): () => void {
  store.clear()
  const host = resolveHost(settings)

  if (settings.mode === 'mock') {
    store.setConnection({ mode: 'mock', host: 'mock data', status: 'connected' })
    return startMock((name, type, value) => store.setValue(name, type, value))
  }

  store.setConnection({ mode: settings.mode, host, status: 'connecting' })
  const client = new NT4Client({
    host,
    port: CONNECTION_DEFAULTS.port,
    topics: ALL_TOPICS,
    onValue: (name, type, value) => store.setValue(name, type, decodeValue(type, value)),
    onStatus: (status) => store.setConnection({ status }),
  })
  client.start()
  return () => client.stop()
}
