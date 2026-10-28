# FRC Smart Dashboard

A web dashboard for an FRC robot that shows live data over NetworkTables 4. It's dark-themed and readable at a glance from the driver station. It shows:

- **Field view**: the 2026 REBUILT field with the robot drawn from its live pose, a heading arrow, a fading 3-second trail, and a blue/red driver-view flip
- **Pose readout**: X, Y, Z in meters, heading in degrees, plus small roll and pitch
- **Three arm dials** (0–360°): animated needle and arc, with a ghost needle for the setpoint when the robot publishes one

A card dims and shows a **STALE** badge if no update arrives for 500 ms.

```
FRC-SmartDashboard/
├─ src/              Vite + React + TypeScript dashboard
│  ├─ config/        topics.ts, field.ts, dashboard.ts  ← edit these
│  ├─ components/    FieldView, PoseCard, ArmDial, Header, Card
│  └─ nt/            NT4 client, struct decoders, store, mock data
├─ public/fields/    field image (from WPILib)
└─ robot/            Java command-based robot project (GradleRIO 2025)
```

## Run the dashboard

You need Node.js 20 or newer.

```bash
npm install
npm run dev          # http://localhost:5173
```

Click the connection pill in the top right to pick where the data comes from:

| Mode   | Connects to                     | Use it for                       |
|--------|---------------------------------|----------------------------------|
| Team # | `10.TE.AM.2:5810` (e.g. 3134 → `10.31.34.2`) | the real robot        |
| IP     | any address you type            | a USB/odd network setup          |
| Sim    | `localhost:5810`                | WPILib desktop simulation        |
| Mock   | nothing                         | UI work with no robot at all     |

Your choice is remembered. You can also set it in the URL for a bookmark: `?mode=mock`, `?team=3134`, or `?host=10.31.34.2`. If the robot drops, the dashboard reconnects every second on its own. If no data arrives for 3 seconds, it treats the robot as gone.

**Alliance view:** *Auto* reads `/FMSInfo/IsRedAlliance` from the Driver Station and turns the field around for red. *Blue* and *Red* force a view.

### On the driver station laptop

There's no internet at events, so build the dashboard once and serve it locally. The fonts and field image are bundled, so nothing loads from the web.

```bash
npm run build
npm run preview      # http://localhost:4173
```

## Test with WPILib simulation

```bash
cd robot
./gradlew simulateJava          # or WPILib VS Code: "Simulate Robot Code"
```

Then open the dashboard in **Sim** mode. The sim robot starts at (3, 4) and sends data even while disabled.

- In the sim GUI, set the robot state to **Autonomous**. The demo auto drives a circle and cycles the arm through presets, so the field robot moves and all three dials swing.
- **Teleop:** drag a controller (or *Keyboard 0*) onto Joystick 0. The left stick drives, the right stick X turns, and A/B/X/Y pick arm presets.

## Robot side (Java, command-based)

The robot code is in `robot/src/main/java/frc/robot/`:

- `subsystems/DashboardSubsystem.java` publishes the pose and arm angles in `periodic()`.
- `Constants.DashboardConstants` holds the topic names. They must match `src/config/topics.ts`.
- `RobotContainer.java` creates and wires the subsystem. `Robot.java` has no dashboard logic.
- `SimDrivetrain` and `SimArm` are stand-ins so this project runs in sim without CTRE libraries. Don't copy them to the real robot.

### Adding it to your robot (CTRE swerve)

Copy `DashboardSubsystem.java` and the `DashboardConstants` class into your project. Then add this in `RobotContainer`:

```java
private final DashboardSubsystem dashboard =
    DashboardSubsystem.fromPose2d(
            () -> drivetrain.getState().Pose,          // Tuner X CommandSwerveDrivetrain
            () -> arm.getShoulderDegrees(),
            () -> arm.getElbowDegrees(),
            () -> arm.getWristDegrees())
        .withSetpoints(                                 // optional: ghost needles
            () -> arm.getShoulderTargetDegrees(),
            () -> arm.getElbowTargetDegrees(),
            () -> arm.getWristTargetDegrees());
```

If you have a 3D pose (for example from vision), use the constructor instead:

```java
new DashboardSubsystem(() -> poseEstimator3d.getEstimatedPosition(), j1, j2, j3);
```

What the subsystem does for you:

- It publishes `/Dashboard/Pose3d` and `/Dashboard/Pose2d` as WPILib structs, and the joint angles as doubles.
- Angles can be in any range. It wraps them to 0–360 with `MathUtil.inputModulus`, plus a fix: `inputModulus(0, 0, 360)` returns **360**, not 0, so 360 is mapped back to 0.
- Publishers use `PubSubOption.keepDuplicates(true)` and a 20 ms period. Without `keepDuplicates`, NT4 only sends values that change. A parked robot would then go quiet, and the dashboard would mark it stale.
- `fromPose2d` is a factory method, not a second constructor. Java won't let two constructors differ only by `Supplier<Pose2d>` vs `Supplier<Pose3d>`, because both erase to `Supplier`.

## Customizing

| Change                         | File                         |
|--------------------------------|------------------------------|
| Topic names                    | `src/config/topics.ts` (and `Constants.DashboardConstants`) |
| Joint names, colors, dial zero/direction | `src/config/dashboard.ts` |
| Stale timeout, trail length, default team | `src/config/dashboard.ts` |
| Field image / dimensions, robot size | `src/config/field.ts`   |

**New season field:** WPILib ships field images with a JSON file that gives the pixel corners of the carpet. Put the PNG in `public/fields/`, then copy `field-image` and `field-dimensions` from the JSON into `src/config/field.ts`. The 2026 image came from `allwpilib/fields/src/main/native/resources/org/wpilib/fields/frc/`.

## Notes on the NT4 client

The dashboard uses its own small NT4 client (`src/nt/NT4Client.ts`, about 150 lines, built on `@msgpack/msgpack`). It doesn't use `ntcore-ts-client`, because version 3.1.3 validates incoming messages against a fixed list of types that doesn't include `struct:*`. It also expects raw values as `ArrayBuffer`, but its msgpack decoder produces `Uint8Array`. Either problem makes it throw and drop the whole frame, including other topics batched in it. Struct decoding for `Pose3d` and `Pose2d` is in `src/nt/structs.ts`. The older `double[]` pose formats also work as a fallback.
