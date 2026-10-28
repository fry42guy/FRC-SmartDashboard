/**
 * Field image and real-world dimensions.
 *
 * The default image and pixel calibration come from WPILib's field-images resources
 * (2026-rebuilt-welded.json). To change seasons, drop a new PNG in public/fields/ and
 * copy the "field-image" corners and "field-dimensions" from WPILib's matching JSON.
 */
export const FIELD = {
  name: '2026 REBUILT',
  /** Path under public/. */
  image: 'fields/2026-rebuilt.png',
  /** Full image size in pixels. */
  imageSize: { width: 4196, height: 2035 },
  /** Pixel coordinates of the field-carpet corners inside the image. */
  fieldCorners: { top: 121, left: 254, bottom: 1917, right: 3951 },
  /** Field size in meters (WPILib blue-origin coordinates: +X toward red, +Y to the left of blue). */
  lengthMeters: 16.541,
  widthMeters: 8.069,
} as const

/** Robot footprint drawn on the field (bumper to bumper). */
export const ROBOT = {
  lengthMeters: 0.9,
  widthMeters: 0.9,
} as const
