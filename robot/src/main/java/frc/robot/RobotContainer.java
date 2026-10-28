// Copyright (c) FIRST and other WPILib contributors.
// Open Source Software; you can modify and/or share it under the terms of
// the WPILib BSD license file in the root directory of this project.

package frc.robot;

import edu.wpi.first.math.MathUtil;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Rotation2d;
import edu.wpi.first.math.kinematics.ChassisSpeeds;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;
import frc.robot.Constants.OperatorConstants;
import frc.robot.Constants.SimConstants;
import frc.robot.subsystems.DashboardSubsystem;
import frc.robot.subsystems.SimArm;
import frc.robot.subsystems.SimDrivetrain;

/**
 * This class is where the bulk of the robot should be declared. Since Command-based is a
 * "declarative" paradigm, very little robot logic should actually be handled in the {@link Robot}
 * periodic methods (other than the scheduler calls). Instead, the structure of the robot (including
 * subsystems, commands, and trigger mappings) should be declared here.
 */
public class RobotContainer {
  private final CommandXboxController m_driverController =
      new CommandXboxController(OperatorConstants.kDriverControllerPort);

  // Stand-ins so this project runs in desktop simulation. On the real robot these are the
  // Tuner X generated CommandSwerveDrivetrain and your arm subsystem.
  private final SimDrivetrain m_drivetrain = new SimDrivetrain();
  private final SimArm m_arm = new SimArm();

  // Publishes pose and arm angles for the web dashboard. With the CTRE swerve, replace
  // m_drivetrain::getPose with () -> drivetrain.getState().Pose
  @SuppressWarnings("unused")
  private final DashboardSubsystem m_dashboard =
      DashboardSubsystem.fromPose2d(
              m_drivetrain::getPose,
              () -> m_arm.getAngleDegrees(0),
              () -> m_arm.getAngleDegrees(1),
              () -> m_arm.getAngleDegrees(2))
          .withSetpoints(
              () -> m_arm.getSetpointDegrees(0),
              () -> m_arm.getSetpointDegrees(1),
              () -> m_arm.getSetpointDegrees(2));

  public RobotContainer() {
    configureBindings();
  }

  private void configureBindings() {
    // Left stick translates, right stick X rotates. Stick forward (negative Y) drives +X.
    m_drivetrain.setDefaultCommand(
        m_drivetrain.driveFieldRelative(
            () ->
                new ChassisSpeeds(
                    -deadband(m_driverController.getLeftY()) * SimConstants.kMaxSpeedMetersPerSecond,
                    -deadband(m_driverController.getLeftX()) * SimConstants.kMaxSpeedMetersPerSecond,
                    -deadband(m_driverController.getRightX())
                        * SimConstants.kMaxAngularRadiansPerSecond)));

    // Arm presets. Some are outside 0–360 on purpose to show the dashboard's wrapping.
    m_driverController.a().onTrue(m_arm.goTo(0, 90, 0));
    m_driverController.b().onTrue(m_arm.goTo(45, 135, 90));
    m_driverController.x().onTrue(m_arm.goTo(-30, 60, 270)); // joint 1 shows 330°
    m_driverController.y().onTrue(m_arm.goTo(120, 200, 405)); // joint 3 shows 45°

    m_driverController
        .start()
        .onTrue(
            m_drivetrain.runOnce(
                () -> m_drivetrain.resetPose(new Pose2d(3.0, 4.0, Rotation2d.fromDegrees(0)))));
  }

  private static double deadband(double value) {
    return MathUtil.applyDeadband(value, OperatorConstants.kDeadband);
  }

  /**
   * Demo autonomous for testing the dashboard: drives a circle while cycling arm presets.
   *
   * @return the command to run in autonomous
   */
  public Command getAutonomousCommand() {
    return Commands.parallel(
        m_drivetrain.driveRobotRelative(() -> new ChassisSpeeds(2.0, 0, 0.8)),
        Commands.sequence(
                m_arm.goTo(45, 135, 90),
                Commands.waitSeconds(2),
                m_arm.goTo(-30, 60, 270),
                Commands.waitSeconds(2),
                m_arm.goTo(120, 200, 405),
                Commands.waitSeconds(2),
                m_arm.goTo(0, 90, 0),
                Commands.waitSeconds(2))
            .repeatedly());
  }
}
