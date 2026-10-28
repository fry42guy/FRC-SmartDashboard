/**
 * Every NetworkTables topic the dashboard reads. Change names here only.
 * These must match Constants.DashboardConstants in the robot code.
 */
export const TOPICS = {
  /** WPILib Pose3d struct (preferred when present). */
  pose3d: '/Dashboard/Pose3d',
  /** WPILib Pose2d struct, used when no Pose3d has been received. */
  pose2d: '/Dashboard/Pose2d',

  arm: [
    { angle: '/Dashboard/Arm/Joint1Deg', setpoint: '/Dashboard/Arm/Joint1SetpointDeg' },
    { angle: '/Dashboard/Arm/Joint2Deg', setpoint: '/Dashboard/Arm/Joint2SetpointDeg' },
    { angle: '/Dashboard/Arm/Joint3Deg', setpoint: '/Dashboard/Arm/Joint3SetpointDeg' },
  ],

  /** Published by the Driver Station / FMS (and by WPILib sim). Used for "Auto" alliance perspective. */
  isRedAlliance: '/FMSInfo/IsRedAlliance',
} as const

/** Flat list used when subscribing. */
export const ALL_TOPICS: string[] = [
  TOPICS.pose3d,
  TOPICS.pose2d,
  ...TOPICS.arm.flatMap((j) => [j.angle, j.setpoint]),
  TOPICS.isRedAlliance,
]
