// Copyright (c) FIRST and other WPILib contributors.
// Open Source Software; you can modify and/or share it under the terms of
// the WPILib BSD license file in the root directory of this project.

package frc.robot.subsystems;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.math.kinematics.ChassisSpeeds;
import edu.wpi.first.wpilibj.DriverStation;
import edu.wpi.first.wpilibj.TimedRobot;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import frc.robot.Constants.SimConstants;
import java.util.function.Supplier;

/**
 * Stand-in for the CTRE swerve drivetrain so this project runs in desktop simulation with no
 * hardware or vendor libraries. It just integrates commanded speeds into a pose. On the real robot,
 * use {@code drivetrain.getState().Pose} from the Tuner X generated drivetrain instead.
 */
public class SimDrivetrain extends SubsystemBase {
  private static final double kRobotHalfSizeMeters = 0.45;

  private Pose2d m_pose = new Pose2d(3.0, 4.0, Rotation2d.fromDegrees(0));
  private ChassisSpeeds m_fieldSpeeds = new ChassisSpeeds();

  public Pose2d getPose() {
    return m_pose;
  }

  public void resetPose(Pose2d pose) {
    m_pose = pose;
  }

  /** Drive with field-relative speeds (+X toward the red wall, +Y left from blue, +omega CCW). */
  public Command driveFieldRelative(Supplier<ChassisSpeeds> speeds) {
    return run(() -> m_fieldSpeeds = speeds.get());
  }

  /** Drive with robot-relative speeds (+X forward, +Y left, +omega CCW). */
  public Command driveRobotRelative(Supplier<ChassisSpeeds> speeds) {
    return run(
        () -> m_fieldSpeeds = ChassisSpeeds.fromRobotRelativeSpeeds(speeds.get(), m_pose.getRotation()));
  }

  @Override
  public void periodic() {
    if (DriverStation.isDisabled()) {
      m_fieldSpeeds = new ChassisSpeeds();
      return;
    }
    double dt = TimedRobot.kDefaultPeriod;
    double x = m_pose.getX() + m_fieldSpeeds.vxMetersPerSecond * dt;
    double y = m_pose.getY() + m_fieldSpeeds.vyMetersPerSecond * dt;
    // Keep the robot on the carpet.
    x = MathUtil.clamp(x, kRobotHalfSizeMeters, SimConstants.kFieldLengthMeters - kRobotHalfSizeMeters);
    y = MathUtil.clamp(y, kRobotHalfSizeMeters, SimConstants.kFieldWidthMeters - kRobotHalfSizeMeters);
    Rotation2d heading =
        m_pose.getRotation().plus(Rotation2d.fromRadians(m_fieldSpeeds.omegaRadiansPerSecond * dt));
    m_pose = new Pose2d(x, y, heading);
  }
}
