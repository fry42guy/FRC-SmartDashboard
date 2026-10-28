# CLAUDE.md — FRC Smart Dashboard

## Project Goal

Build a polished, modern web dashboard for an FRC robot that shows live robot data over NetworkTables 4. It should look clean and professional on a driver station laptop and be readable at a glance during a match.

## Robot Side Assumptions

- Robot code is Java with WPILib (command-based, CTRE swerve).
- Robot publishes data to NetworkTables 4 (NT4) on the standard port 5810.
- Pose is published as a WPILib `Pose3d` struct (and/or `Pose2d` struct) using the standard struct schema.
- Arm angles are published as doubles in degrees.

## Robot Code (Java, Command-Based) — REQUIRED

All robot-side code must be Java using WPILib's command-based structure. Do not use Python, C++, or a timed/iterative robot.

- Create `DashboardSubsystem extends SubsystemBase` in `src/main/java/frc/robot/subsystems/`.
- Constructor takes suppliers: `Supplier<Pose3d>` (or `Supplier<Pose2d>`) from the drivetrain/pose estimator and three `DoubleSupplier`s for arm joint angles in degrees.
- Publish in `periodic()` using NT4 `StructPublisher<Pose3d>` / `StructPublisher<Pose2d>` and `DoublePublisher` from `NetworkTableInstance.getDefault()`.
- Wrap arm angles to 0–360 with `MathUtil.inputModulus(angle, 0, 360)` before publishing.
- Instantiate and wire it up in `RobotContainer`; no logic in `Robot.java`.
- Topic name strings live in `Constants.DashboardConstants`.
- Follow WPILib Java conventions; must build with GradleRIO and run in WPILib desktop simulation.
- Works with the CTRE swerve drivetrain's pose (`getState().Pose`).

## Tech Stack

- Vite + React + TypeScript.
- NT4 client: `ntcore-ts-client` (or equivalent maintained TS NT4 client).
- Styling: Tailwind CSS, dark theme by default.
- Field and gauges drawn with SVG or HTML canvas (no heavy chart libraries needed).

## NetworkTables Topics (configurable in one config file)

- `/Dashboard/Pose3d` — robot pose (x, y, z meters; roll, pitch, yaw)
- `/Dashboard/Pose2d` — fallback 2D pose
- `/Dashboard/Arm/Joint1Deg`
- `/Dashboard/Arm/Joint2Deg`
- `/Dashboard/Arm/Joint3Deg`
- Optional: `/Dashboard/Arm/Joint{N}SetpointDeg` for target overlays

All topic names must live in `src/config/topics.ts` so they are easy to change.

## Widgets

### 1. Pose XYZ Readout

- Large, clear numeric display of X, Y, Z in meters (2 decimals) plus heading in degrees.
- Optional small roll and pitch readout.
- Values update live; dim or flag the card when data is stale (no update in over 500 ms).

### 2. 2D Field View (Live Pose)

- Top-down field image for the current season, scaled to real field dimensions in meters.
- Robot drawn as a rectangle with a heading arrow, positioned from the live pose.
- Short fading trail showing recent path (last few seconds).
- Support flipping for red vs. blue alliance perspective.
- Field image and dimensions configurable in `src/config/field.ts`.

### 3. Three Arm Angle Dials (0–360°)

- Three circular dial gauges, one per arm joint, each labeled (Joint 1, Joint 2, Joint 3; names configurable).
- Needle or arc shows current angle across the full 0–360° range, with numeric value in the center.
- Optional ghost needle for the setpoint if that topic exists.
- Smooth animation between updates; correct wraparound at 0/360.

## Layout and Look

- Dark theme, high contrast, large fonts readable from a few feet away.
- Field view takes the main area; XYZ card and three dials in a side or bottom panel.
- Connection status indicator (connected / disconnected, robot IP) in the header.
- Responsive to common driver station laptop resolutions.

## Connection

- Robot address configurable (team number to `10.TE.AM.2`, or a manual IP, or `localhost` for simulation).
- Auto-reconnect when the robot drops.
- Must work with WPILib desktop simulation for testing without a robot.

## Development Notes

- Include a mock data mode that animates fake pose and arm values so the UI can be built without a robot.
- Keep widgets as separate reusable components in `src/components/`.
- Provide a short README with run, build, and robot-side publishing examples in Java.

## Done When

- Dashboard connects to sim or robot, shows live XYZ, moves the robot on the 2D field, and spins all three dials smoothly from real NT4 data.

## Implementation Notes (decisions made while building)

- **NT4 client is custom** (`src/nt/NT4Client.ts` on `@msgpack/msgpack`). `ntcore-ts-client` 3.1.3 rejects `struct:*` type strings and raw `Uint8Array` values in its zod validation, so it can't receive Pose3d/Pose2d structs.
- **`DashboardSubsystem.fromPose2d(...)`** is a static factory instead of a second constructor: `Supplier<Pose2d>` and `Supplier<Pose3d>` have the same erasure, so they can't be overloaded.
- **`inputModulus(x, 0, 360)` returns 360 for multiples of 360**; the subsystem maps that to 0. The dashboard also wraps incoming angles.
- **Publishers use `keepDuplicates(true)`** so unchanged values still stream at 50 Hz; otherwise a stationary robot looks stale.
- Dashboard app lives at the repo root; the Java robot project lives in `robot/` (GradleRIO 2025.2.1). `SimDrivetrain`/`SimArm` are sim-only stand-ins for the CTRE swerve and real arm.
- Verify the dashboard against sim with `cd robot && ./gradlew simulateJava`, then open the dashboard with `?mode=sim`.
