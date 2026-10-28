import { decodeMulti, encode } from '@msgpack/msgpack'

/**
 * Minimal read-only NetworkTables 4 client for the browser.
 *
 * Protocol summary (WPILib NT4 spec):
 *  - WebSocket to ws://<host>:5810/nt/<clientName>
 *  - Text frames are JSON arrays of {method, params}; we send "subscribe" and receive "announce"/"unannounce".
 *  - Binary frames are a stream of msgpack arrays [topicId, timestampUs, typeIndex, value].
 *    Topic id -1 is the time-sync echo, which we use as a heartbeat.
 *
 * We don't use ntcore-ts-client because (as of 3.1.3) it rejects "struct:*" type strings and
 * raw byte values during message validation, so Pose3d/Pose2d struct topics can't be received.
 */

export type NTStatus = 'connecting' | 'connected' | 'disconnected'

export interface NT4ClientOptions {
  host: string
  port: number
  topics: string[]
  onValue: (name: string, type: string, value: unknown) => void
  onStatus: (status: NTStatus) => void
}

const SUBPROTOCOLS = ['v4.1.networktables.first.wpi.edu', 'networktables.first.wpi.edu']
const TYPE_INT = 2
/** Ask the server for updates this often (seconds). The NT4 default is 0.1 s, too slow for smooth motion. */
const SUBSCRIBE_PERIOD_S = 0.02
const CONNECT_TIMEOUT_MS = 2500
const HEARTBEAT_MS = 1000
/** Drop the socket if nothing at all arrives for this long (covers a robot losing power mid-match). */
const SILENCE_TIMEOUT_MS = 3000
const RECONNECT_MS = 1000

export class NT4Client {
  private readonly opts: NT4ClientOptions
  private ws: WebSocket | null = null
  private topicsById = new Map<number, { name: string; type: string }>()
  private connectTimer: number | undefined
  private heartbeatTimer: number | undefined
  private reconnectTimer: number | undefined
  private lastReceive = 0
  private stopped = true

  constructor(opts: NT4ClientOptions) {
    this.opts = opts
  }

  start() {
    this.stopped = false
    this.open()
  }

  stop() {
    this.stopped = true
    window.clearTimeout(this.reconnectTimer)
    this.dropSocket()
    this.opts.onStatus('disconnected')
  }

  private open() {
    if (this.stopped) return
    this.opts.onStatus('connecting')

    const clientName = `dashboard-${Math.random().toString(36).slice(2, 8)}`
    let ws: WebSocket
    try {
      ws = new WebSocket(`ws://${this.opts.host}:${this.opts.port}/nt/${clientName}`, SUBPROTOCOLS)
    } catch {
      this.scheduleReconnect()
      return
    }
    ws.binaryType = 'arraybuffer'
    this.ws = ws

    // Browsers can sit in CONNECTING for 20+ seconds when the robot is off; give up sooner.
    this.connectTimer = window.setTimeout(() => this.handleLost(), CONNECT_TIMEOUT_MS)

    ws.onopen = () => {
      window.clearTimeout(this.connectTimer)
      this.lastReceive = performance.now()
      this.sendJson([
        {
          method: 'subscribe',
          params: { topics: this.opts.topics, subuid: 1, options: { periodic: SUBSCRIBE_PERIOD_S } },
        },
      ])
      this.heartbeatTimer = window.setInterval(() => this.heartbeat(), HEARTBEAT_MS)
      this.opts.onStatus('connected')
    }
    ws.onmessage = (event) => {
      this.lastReceive = performance.now()
      if (typeof event.data === 'string') this.handleText(event.data)
      else this.handleBinary(event.data as ArrayBuffer)
    }
    ws.onclose = () => this.handleLost()
    ws.onerror = () => this.handleLost()
  }

  private handleText(data: string) {
    let messages: { method: string; params: Record<string, unknown> }[]
    try {
      messages = JSON.parse(data)
    } catch {
      return
    }
    for (const msg of messages) {
      if (msg.method === 'announce') {
        const { id, name, type } = msg.params as { id: number; name: string; type: string }
        this.topicsById.set(id, { name, type })
      } else if (msg.method === 'unannounce') {
        this.topicsById.delete((msg.params as { id: number }).id)
      }
    }
  }

  private handleBinary(data: ArrayBuffer) {
    try {
      for (const frame of decodeMulti(new Uint8Array(data))) {
        if (!Array.isArray(frame) || frame.length < 4) continue
        const id = frame[0] as number
        if (id < 0) continue // time-sync echo; receiving it already counts as a heartbeat
        const topic = this.topicsById.get(id)
        if (topic) this.opts.onValue(topic.name, topic.type, frame[3])
      }
    } catch (err) {
      console.warn('NT4: bad binary frame', err)
    }
  }

  private heartbeat() {
    if (performance.now() - this.lastReceive > SILENCE_TIMEOUT_MS) {
      this.handleLost()
      return
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(encode([-1, 0, TYPE_INT, Math.round(performance.now() * 1000)]))
    }
  }

  private sendJson(payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload))
  }

  /** Socket closed, errored, timed out, or went silent: clean up and try again. */
  private handleLost() {
    if (!this.ws) return
    this.dropSocket()
    this.opts.onStatus('disconnected')
    this.scheduleReconnect()
  }

  private dropSocket() {
    window.clearTimeout(this.connectTimer)
    window.clearInterval(this.heartbeatTimer)
    const ws = this.ws
    this.ws = null
    this.topicsById.clear()
    if (ws) {
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null
      try {
        ws.close()
      } catch {
        // already closed
      }
    }
  }

  private scheduleReconnect() {
    if (this.stopped) return
    window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = window.setTimeout(() => this.open(), RECONNECT_MS)
  }
}
