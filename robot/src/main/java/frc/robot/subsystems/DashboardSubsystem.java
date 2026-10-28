// Copyright (c) FIRST and other WPILib contributors.
// Open Source Software; you can modify and/or share it under the terms of
// the WPILib BSD license file in the root directory of this project.

package frc.robot.subsystems;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Pose3d;
import edu.wpi.first.networktables.DoublePublisher;
import edu.wpi.first.networktables.NetworkTableInstance;
import edu.wpi.first.networktables.PubSubOption;
import edu.wpi.first.networktables.StructPublisher;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import frc.robot.Constants.DashboardConstants;
import java.util.function.DoubleSupplier;
import java.util.function.Supplier;

/**
 * Publishes the robot pose and three arm joint angles to NetworkTables 4 for the web dashboard.
 *
 * <p>It only reads from suppliers, so it never needs to know about the drivetrain or arm classes.
 * The pose goes out as both a Pose3d struct and a Pose2d struct. Arm angles are wrapped to 0–360°.
 *
 * <p>With the CTRE Tuner X swerve drivetrain:
 *
 * <pre>{@code
 * DashboardSubsystem.fromPose2d(
 *     () -> drivetrain.getState().Pose,
 *     arm::getJoint1Degrees, arm::getJoint2Degrees, arm::getJoint3Degrees);
 * }</pre>
 */
public class DashboardSubsystem extends SubsystemBase {
  private static final String[] kJointTopics = {
    DashboardConstants.kJoint1Topic, DashboardConstants.kJoint2Topic, DashboardConstants.kJoint3Topic
  };
  private static final String[] kSetpointTopics = {
    DashboardConstants.kJoint1SetpointTopic,
    DashboardConstants.kJoint2SetpointTopic,
    DashboardConstants.kJoint3SetpointTopic
  };

  private final NetworkTableInstance m_nt = NetworkTableInstance.getDefault();
  // keepDuplicates sends every value, even unchanged ones. Without it a robot sitting still stops
  // sending anything, and the dashboard can't tell "not moving" from "not connected".
  private final PubSubOption[] m_options = {
    PubSubOption.periodic(DashboardConstants.kPublishPeriodSeconds), PubSubOption.keepDuplicates(true)
  };

  private final Supplier<Pose3d> m_poseSupplier;
  private final DoubleSupplier[] m_jointSuppliers;
  private DoubleSupplier[] m_setpointSuppliers = new DoubleSupplier[0];

  private final StructPublisher<Pose3d> m_pose3dPublisher;
  private final StructPublisher<Pose2d> m_pose2dPublisher;
  private final DoublePublisher[] m_jointPublishers;
  private DoublePublisher[] m_setpointPublishers = new DoublePublisher[0];

  /**
   * Creates the dashboard publisher from a 3D pose.
   *
   * @param poseSupplier robot pose on the field (WPILib blue-origin coordinates)
   * @param joint1Degrees arm joint 1 angle in degrees (any range; wrapped to 0–360 before sending)
   * @param joint2Degrees arm joint 2 angle in degrees
   * @param joint3Degrees arm joint 3 angle in degrees
   */
  public DashboardSubsystem(
      Supplier<Pose3d> poseSupplier,
      DoubleSupplier joint1Degrees,
      DoubleSupplier joint2Degrees,
      DoubleSupplier joint3Degrees) {
    m_poseSupplier = poseSupplier;
    m_jointSuppliers = new DoubleSupplier[] {joint1Degrees, joint2Degrees, joint3Degrees};

    m_pose3dPublisher =
        m_nt.getStructTopic(DashboardConstants.kPose3dTopic, Pose3d.struct).publish(m_options);
    m_pose2dPublisher =
        m_nt.getStructTopic(DashboardConstants.kPose2dTopic, Pose2d.struct).publish(m_options);
    m_jointPublishers = createDoublePublishers(kJointTopics);
  }

  /**
   * Creates the dashboard publisher from a 2D pose, such as the CTRE swerve's {@code
   * getState().Pose}. Z, roll and pitch are sent as zero.
   *
   * <p>This is a factory method rather than a second constructor because Java can't overload on
   * {@code Supplier<Pose2d>} vs {@code Supplier<Pose3d>} (both erase to {@code Supplier}).
   */
  public static DashboardSubsystem fromPose2d(
      Supplier<Pose2d> poseSupplier,
      DoubleSupplier joint1Degrees,
      DoubleSupplier joint2Degrees,
      DoubleSupplier joint3Degrees) {
    return new DashboardSubsystem(
        () -> {
          Pose2d pose = poseSupplier.get();
          return pose == null ? null : new Pose3d(pose);
        },
        joint1Degrees,
        joint2Degrees,
        joint3Degrees);
  }

  /**
   * Also publish arm setpoints so the dashboard can draw a ghost needle on each dial. Optional.
   *
   * @return this subsystem, for chaining
   */
  public DashboardSubsystem withSetpoints(
      DoubleSupplier joint1Degrees, DoubleSupplier joint2Degrees, DoubleSupplier joint3Degrees) {
    m_setpointSuppliers = new DoubleSupplier[] {joint1Degrees, joint2Degrees, joint3Degrees};
    m_setpointPublishers = createDoublePublishers(kSetpointTopics);
    return this;
  }

  @Override
  public void periodic() {
    Pose3d pose = m_poseSupplier.get();
    if (pose != null) {
      m_pose3dPublisher.set(pose);
      m_pose2dPublisher.set(pose.toPose2d());
    }
    publishAngles(m_jointSuppliers, m_jointPublishers);
    publishAngles(m_setpointSuppliers, m_setpointPublishers);
  }

  private DoublePublisher[] createDoublePublishers(String[] topics) {
    DoublePublisher[] publishers = new DoublePublisher[topics.length];
    for (int i = 0; i < topics.length; i++) {
      publishers[i] = m_nt.getDoubleTopic(topics[i]).publish(m_options);
    }
    return publishers;
  }

  private static void publishAngles(DoubleSupplier[] suppliers, DoublePublisher[] publishers) {
    for (int i = 0; i < publishers.length; i++) {
      publishers[i].set(wrapTo360(suppliers[i].getAsDouble()));
    }
  }

  /** Wraps to [0, 360). inputModulus alone returns 360 (not 0) for 0, 360, 720, ... */
  private static double wrapTo360(double degrees) {
    double wrapped = MathUtil.inputModulus(degrees, 0, 360);
    return wrapped >= 360 ? 0 : wrapped;
  }
}
