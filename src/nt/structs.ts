/**
 * Decoders for the WPILib struct types the dashboard uses.
 *
 * WPILib structs are packed little-endian with no padding:
 *   Pose3d = Translation3d (x, y, z) + Rotation3d (Quaternion w, x, y, z)  -> 7 doubles, 56 bytes
 *   Pose2d = Translation2d (x, y)    + Rotation2d (radians)                -> 3 doubles, 24 bytes
 */

/** Robot pose. Lengths in meters, angles in radians (WPILib conventions). */
export interface Pose {
  x: number
  y: number
  z: number
  roll: number
  pitch: number
  yaw: number
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

/** Quaternion to roll/pitch/yaw, matching WPILib Rotation3d.getX()/getY()/getZ(). */
export function quaternionToEuler(w: number, x: number, y: number, z: number) {
  const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y))
  const sinPitch = Math.max(-1, Math.min(1, 2 * (w * y - z * x)))
  const pitch = Math.asin(sinPitch)
  const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))
  return { roll, pitch, yaw }
}

export function decodePose3d(bytes: Uint8Array): Pose | null {
  if (bytes.byteLength < 56) return null
  const v = view(bytes)
  const d = (i: number) => v.getFloat64(i * 8, true)
  return { x: d(0), y: d(1), z: d(2), ...quaternionToEuler(d(3), d(4), d(5), d(6)) }
}

export function decodePose2d(bytes: Uint8Array): Pose | null {
  if (bytes.byteLength < 24) return null
  const v = view(bytes)
  const d = (i: number) => v.getFloat64(i * 8, true)
  return { x: d(0), y: d(1), z: 0, roll: 0, pitch: 0, yaw: d(2) }
}

/**
 * Turns a raw NT4 value into something the widgets can use, based on the announced type.
 * Also accepts the older double[] pose formats (AdvantageScope style) as a fallback:
 *   [x, y, degrees] for 2D, [x, y, z, qw, qx, qy, qz] for 3D.
 */
export function decodeValue(type: string, value: unknown): unknown {
  if (value instanceof Uint8Array) {
    if (type === 'struct:Pose3d') return decodePose3d(value)
    if (type === 'struct:Pose2d') return decodePose2d(value)
    return value
  }
  if (type === 'double[]' && Array.isArray(value)) {
    const a = value as number[]
    if (a.length === 7) return { x: a[0], y: a[1], z: a[2], ...quaternionToEuler(a[3], a[4], a[5], a[6]) }
    if (a.length === 3) return { x: a[0], y: a[1], z: 0, roll: 0, pitch: 0, yaw: (a[2] * Math.PI) / 180 }
  }
  return value
}

export function isPose(v: unknown): v is Pose {
  return typeof v === 'object' && v !== null && 'x' in v && 'yaw' in v
}
