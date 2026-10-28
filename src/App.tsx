import { useEffect, useState } from 'react'
import { ArmDial } from './components/ArmDial'
import { dataState } from './components/Card'
import { FieldView } from './components/FieldView'
import { Header, type Perspective } from './components/Header'
import { PoseCard } from './components/PoseCard'
import { ARM_JOINTS, STALE_MS } from './config/dashboard'
import { TOPICS } from './config/topics'
import { usePose } from './hooks/usePose'
import { startDataSource } from './nt/dataSource'
import { loadSettings, saveSettings, type ConnectionSettings } from './nt/settings'
import { useNow, useTopic } from './nt/store'
import { wrap360 } from './util/angles'

const PERSPECTIVE_KEY = 'frc-dashboard.perspective'

function loadPerspective(): Perspective {
  try {
    const p = localStorage.getItem(PERSPECTIVE_KEY)
    if (p === 'auto' || p === 'blue' || p === 'red') return p
  } catch {
    // storage unavailable
  }
  return 'auto'
}

export default function App() {
  const [settings, setSettings] = useState<ConnectionSettings>(loadSettings)
  const [perspective, setPerspective] = useState<Perspective>(loadPerspective)

  useEffect(() => startDataSource(settings), [settings])

  const now = useNow(50)
  const pose = usePose()
  const fms = useTopic(TOPICS.isRedAlliance)
  const isRed = perspective === 'red' || (perspective === 'auto' && fms?.value === true)
  const poseState = dataState(pose?.receivedAt, now, STALE_MS)

  const changeSettings = (s: ConnectionSettings) => {
    saveSettings(s)
    setSettings(s)
  }
  const changePerspective = (p: Perspective) => {
    try {
      localStorage.setItem(PERSPECTIVE_KEY, p)
    } catch {
      // storage unavailable
    }
    setPerspective(p)
  }

  return (
    <div className="flex h-screen flex-col bg-bg text-ink">
      <Header
        settings={settings}
        onSettingsChange={changeSettings}
        perspective={perspective}
        onPerspectiveChange={changePerspective}
        isRed={isRed}
      />

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 lg:grid-cols-[minmax(0,1fr)_clamp(240px,24vw,400px)] lg:grid-rows-[minmax(0,1fr)_auto] lg:overflow-hidden">
        <FieldView
          className="min-h-[300px] lg:col-start-1 lg:row-start-1"
          pose={pose?.pose ?? null}
          state={poseState}
          redPerspective={isRed}
          allianceColor={isRed ? '#ef4444' : '#3b82f6'}
          now={now}
        />
        <PoseCard className="lg:col-start-1 lg:row-start-2" reading={pose} state={poseState} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-0 lg:grid-cols-1 lg:grid-rows-3">
          {ARM_JOINTS.map((joint, i) => (
            <JointDial key={joint.label} index={i} now={now} />
          ))}
        </div>
      </main>
    </div>
  )
}

function JointDial({ index, now }: { index: number; now: number }) {
  const joint = ARM_JOINTS[index]
  const angle = useTopic(TOPICS.arm[index].angle)
  const setpoint = useTopic(TOPICS.arm[index].setpoint)
  // Wrap here too so robot code that sends 360 or negative angles still reads correctly.
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? wrap360(v) : null)
  return (
    <ArmDial
      className="min-h-[200px] lg:min-h-0"
      label={joint.label}
      color={joint.color}
      angle={num(angle?.value)}
      // Hide the ghost needle once the setpoint topic goes quiet.
      setpoint={dataState(setpoint?.receivedAt, now, STALE_MS) === 'live' ? num(setpoint?.value) : null}
      state={dataState(angle?.receivedAt, now, STALE_MS)}
      zeroAtDeg={joint.zeroAtDeg}
      direction={joint.direction}
    />
  )
}
