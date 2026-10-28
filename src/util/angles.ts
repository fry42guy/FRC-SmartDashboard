export const RAD_TO_DEG = 180 / Math.PI

/** Degrees in [0, 360). */
export const wrap360 = (deg: number) => ((deg % 360) + 360) % 360

/** Degrees in (-180, 180], matching WPILib Rotation2d.getDegrees() style. */
export const wrap180 = (deg: number) => {
  const d = wrap360(deg)
  return d > 180 ? d - 360 : d
}

/** Signed shortest difference b - a in degrees, in [-180, 180). */
export const shortestDelta = (a: number, b: number) => wrap360(b - a + 180) - 180
