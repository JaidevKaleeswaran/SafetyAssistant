import Foundation
import SwiftUI
#if os(iOS)
import CoreMotion
#endif

@MainActor
public final class MotionBalanceService: ObservableObject {
    @Published public var pitchDegrees: Double = 0.0
    @Published public var rollDegrees: Double = 0.0
    @Published public var totalTiltDegrees: Double = 0.0
    @Published public var liveStabilityScore: Double = 100.0
    @Published public var wobbleCount: Int = 0
    @Published public var isMonitoring: Bool = false
    @Published public var isDeviceFlat: Bool = true

    #if os(iOS)
    private let motionManager = CMMotionManager()
    #endif
    private var totalSamples: Int = 0
    private var totalTiltSum: Double = 0.0
    private var maxTilt: Double = 0.0
    private var wasTiltedOut: Bool = false
    private var simulationTimer: Timer? = nil

    public init() {}

    public func startMonitoring() {
        #if os(iOS)
        if motionManager.isDeviceMotionAvailable {
            motionManager.deviceMotionUpdateInterval = 1.0 / 60.0
            motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
                guard let self = self, let motion = motion else { return }

                let pitch = motion.attitude.pitch * (180.0 / .pi)
                let roll = motion.attitude.roll * (180.0 / .pi)
                let tilt = sqrt(pitch * pitch + roll * roll)

                Task { @MainActor in
                    self.pitchDegrees = pitch
                    self.rollDegrees = roll
                    self.totalTiltDegrees = tilt
                    self.totalSamples += 1
                    self.totalTiltSum += tilt
                    if tilt > self.maxTilt { self.maxTilt = tilt }

                    let thresholdDegrees: Double = 12.0
                    if tilt > thresholdDegrees {
                        self.isDeviceFlat = false
                        if !self.wasTiltedOut {
                            self.wobbleCount += 1
                            self.wasTiltedOut = true
                        }
                    } else {
                        self.isDeviceFlat = true
                        self.wasTiltedOut = false
                    }

                    let tiltPenalty = min(50.0, tilt * 2.5)
                    let wobblePenalty = Double(self.wobbleCount) * 8.0
                    let currentScore = max(0.0, min(100.0, 100.0 - tiltPenalty - wobblePenalty))
                    self.liveStabilityScore = currentScore
                }
            }
            isMonitoring = true
            totalSamples = 0
            totalTiltSum = 0.0
            maxTilt = 0.0
            wobbleCount = 0
            wasTiltedOut = false
            return
        }
        #endif

        simulateMotion()
    }

    public func stopMonitoring() -> BalanceTestResult {
        #if os(iOS)
        if motionManager.isDeviceMotionActive {
            motionManager.stopDeviceMotionUpdates()
        }
        #endif
        simulationTimer?.invalidate()
        simulationTimer = nil
        isMonitoring = false

        let avgTilt = totalSamples > 0 ? (totalTiltSum / Double(totalSamples)) : 2.0
        let finalScore = max(0.0, min(100.0, liveStabilityScore))

        return BalanceTestResult(
            stabilityScore: finalScore,
            completionTime: AssessmentConstants.balanceDurationSec,
            avgTiltDegrees: avgTilt,
            maxTiltDegrees: maxTilt,
            wobbleCount: wobbleCount,
            passed: finalScore >= 80.0
        )
    }

    private func simulateMotion() {
        isMonitoring = true
        totalSamples = 0
        totalTiltSum = 0.0
        maxTilt = 0.0
        wobbleCount = 0

        simulationTimer?.invalidate()
        simulationTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self, self.isMonitoring else { return }
                let driftP = Double.random(in: -3.0...3.0)
                let driftR = Double.random(in: -3.0...3.0)
                let tilt = sqrt(driftP * driftP + driftR * driftR)

                self.pitchDegrees = driftP
                self.rollDegrees = driftR
                self.totalTiltDegrees = tilt
                self.totalSamples += 1
                self.totalTiltSum += tilt
                self.isDeviceFlat = true
                self.liveStabilityScore = max(85.0, 100.0 - tilt * 1.5)
            }
        }
    }
}
