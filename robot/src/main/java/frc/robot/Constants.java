// Copyright (c) FIRST and other WPILib contributors.
// Open Source Software; you can modify and/or share it under the terms of
// the WPILib BSD license file in the root directory of this project.

package frc.robot;

/**
 * The Constants class provides a convenient place for teams to hold robot-wide numerical or boolean
 * constants. This class should not be used for any other purpose. All constants should be declared
 * globally (i.e. public static). Do not put anything functional in this class.
 */
public final class Constants {
  public static final class OperatorConstants {
    public static final int kDriverControllerPort = 0;
    public static final double kDeadband = 0.1;
  }

  /**
   * NetworkTables topic names read by the web dashboard. These must match src/config/topics.ts in
   * the dashboard project.
   */
  public static final class DashboardConstants {
    public static final String kPose3dTopic = "/Dashboard/Pose3d";
    public static final String kPose2dTopic = "/Dashboard/Pose2d";

    public static final String kJoint1Topic = "/Dashboard/Arm/Joint1Deg";
    public static final String kJoint2Topic = "/Dashboard/Arm/Joint2Deg";
    public static final String kJoint3Topic = "/Dashboard/Arm/Joint3Deg";

    public static final String kJoint1SetpointTopic = "/Dashboard/Arm/Joint1SetpointDeg";
    public static final String kJoint2SetpointTopic = "/Dashboard/Arm/Joint2SetpointDeg";
    public static final String kJoint3SetpointTopic = "/Dashboard/Arm/Joint3SetpointDeg";

    /** How often values are sent over the network, in seconds (NT4's default is 0.1). */
    public static final double kPublishPeriodSeconds = 0.02;
  }

  /** Tuning for the simulated drivetrain and arm in this example project. */
  public static final class SimConstants {
    public static final double kMaxSpeedMetersPerSecond = 4.0;
    public static final double kMaxAngularRadiansPerSecond = 2 * Math.PI;
    public static final double kArmMaxDegreesPerSecond = 180.0;

    /** 2026 REBUILT field, used to keep the simulated robot on the carpet. */
    public static final double kFieldLengthMeters = 16.541;
    public static final double kFieldWidthMeters = 8.069;
  }
}
