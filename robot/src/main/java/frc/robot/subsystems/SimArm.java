// Copyright (c) FIRST and other WPILib contributors.
// Open Source Software; you can modify and/or share it under the terms of
// the WPILib BSD license file in the root directory of this project.

package frc.robot.subsystems;

import edu.wpi.first.wpilibj.DriverStation;
import edu.wpi.first.wpilibj.TimedRobot;
import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import frc.robot.Constants.SimConstants;

/**
 * Stand-in for a three-joint arm so the dashboard dials have something to show in simulation. Each
 * joint moves toward its setpoint at a fixed speed while the robot is enabled.
 *
 * <p>Angles are left unbounded (like a real encoder that has turned more than once), so values
 * such as -30° or 405° show the dashboard subsystem's 0–360 wrapping.
 */
public class SimArm extends SubsystemBase {
  private final double[] m_anglesDegrees = {0, 90, 0};
  private final double[] m_setpointsDegrees = {0, 90, 0};

  /** Joint angle in degrees. {@code joint} is 0, 1 or 2. */
  public double getAngleDegrees(int joint) {
    return m_anglesDegrees[joint];
  }

  /** Joint setpoint in degrees. {@code joint} is 0, 1 or 2. */
  public double getSetpointDegrees(int joint) {
    return m_setpointsDegrees[joint];
  }

  /** Sets all three joint targets and finishes immediately; the joints keep moving afterwards. */
  public Command goTo(double joint1Degrees, double joint2Degrees, double joint3Degrees) {
    return runOnce(
        () -> {
          m_setpointsDegrees[0] = joint1Degrees;
          m_setpointsDegrees[1] = joint2Degrees;
          m_setpointsDegrees[2] = joint3Degrees;
        });
  }

  @Override
  public void periodic() {
    if (DriverStation.isDisabled()) {
      return;
    }
    double maxStep = SimConstants.kArmMaxDegreesPerSecond * TimedRobot.kDefaultPeriod;
    for (int i = 0; i < m_anglesDegrees.length; i++) {
      double error = m_setpointsDegrees[i] - m_anglesDegrees[i];
      m_anglesDegrees[i] += Math.copySign(Math.min(Math.abs(error), maxStep), error);
    }
  }
}
