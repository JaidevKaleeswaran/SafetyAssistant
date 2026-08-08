import SwiftUI

public struct BalanceTestView: View {
    public var onComplete: (BalanceTestResult) -> Void

    @StateObject private var motionService = MotionBalanceService()
    @State private var phase: TestPhase = .intro
    @State private var timeLeft: Double = AssessmentConstants.balanceDurationSec

    private let testDuration: Double = AssessmentConstants.balanceDurationSec

    enum TestPhase {
        case intro
        case active
        case completed
    }

    public init(onComplete: @escaping (BalanceTestResult) -> Void) {
        self.onComplete = onComplete
    }

    public var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.1).ignoresSafeArea()

            switch phase {
            case .intro:
                introView
            case .active:
                activeTestView
            case .completed:
                completedView
            }
        }
    }

    private var introView: View {
        VStack(spacing: 20) {
            // 7-Second Decreasing Auto-Start Progress Bar
            AutoStartTimerBarView(duration: AssessmentConstants.autoStartDurationSec) {
                startTest()
            }

            VStack(spacing: 8) {
                Text("Palm Balance Test")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("Place your phone flat on your open palm and hold it steady for 15 seconds")
                    .font(.system(size: 15))
                    .foregroundColor(Color.gray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
            }

            Spacer()

            // Hero Spirit Level Preview Badge
            ZStack {
                RoundedRectangle(cornerRadius: 36)
                    .fill(LinearGradient(colors: [Color.teal.opacity(0.3), Color.blue.opacity(0.2)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 210, height: 210)
                    .overlay(
                        RoundedRectangle(cornerRadius: 36)
                            .stroke(Color.teal.opacity(0.8), lineWidth: 2)
                    )
                    .shadow(color: Color.teal.opacity(0.4), radius: 25)

                ZStack {
                    Circle().stroke(Color.white.opacity(0.4), lineWidth: 2).frame(width: 140, height: 140)
                    Circle().stroke(Color.teal, lineWidth: 3).frame(width: 70, height: 70)
                    Circle().fill(Color.teal).frame(width: 24, height: 24)
                }
            }

            Spacer()

            Button(action: startTest) {
                HStack(spacing: 8) {
                    Text("Start Balance Test Now")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 18, weight: .bold))
                }
                .foregroundColor(Color(red: 0.05, green: 0.1, blue: 0.15))
                .frame(maxWidth: .infinity)
                .frame(height: 68)
                .background(Color.teal)
                .cornerRadius(34)
                .shadow(color: Color.teal.opacity(0.6), radius: 18, x: 0, y: 6)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
        }
    }

    private var activeTestView: View {
        VStack(spacing: 16) {
            // HUD Bar
            HStack {
                HStack(spacing: 12) {
                    CountdownRingView(
                        progress: (testDuration - timeLeft) / testDuration,
                        seconds: Int(ceil(timeLeft)),
                        size: 44,
                        strokeWidth: 4,
                        ringColor: motionService.isDeviceFlat ? Color.teal : Color.red
                    )
                    VStack(alignment: .leading, spacing: 2) {
                        Text("TIME REMAINING")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.teal)
                        Text(String(format: "%.1fs", timeLeft))
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("BALANCE STABILITY")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.gray)
                    Text("\(Int(motionService.liveStabilityScore))%")
                        .font(.system(size: 18, weight: .black))
                        .foregroundColor(motionService.liveStabilityScore >= 80 ? .emerald : .red)
                }
            }
            .padding()
            .background(Color.white.opacity(0.06))
            .cornerRadius(20)
            .padding(.horizontal)

            // Spirit Level Canvas Target Display
            GeometryReader { geo in
                let size = min(geo.size.width, geo.size.height)
                let radius = size / 2.0 - 20

                // Bubble offset based on roll (x) and pitch (y)
                let offsetX = CGFloat(motionService.rollDegrees / 30.0) * radius
                let offsetY = CGFloat(motionService.pitchDegrees / 30.0) * radius

                ZStack {
                    RoundedRectangle(cornerRadius: 28)
                        .fill(motionService.isDeviceFlat ? Color.black.opacity(0.85) : Color.red.opacity(0.12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 28)
                                .stroke(motionService.isDeviceFlat ? Color.teal : Color.red, lineWidth: 2)
                        )
                        .shadow(color: (motionService.isDeviceFlat ? Color.teal : Color.red).opacity(0.4), radius: 20)

                    // Target Concentric Circles
                    Circle()
                        .stroke(Color.white.opacity(0.15), lineWidth: 2)
                        .frame(width: radius * 1.6, height: radius * 1.6)

                    Circle()
                        .stroke(Color.teal.opacity(0.4), lineWidth: 2)
                        .frame(width: radius * 0.9, height: radius * 0.9)

                    Circle()
                        .stroke(Color.teal, lineWidth: 3)
                        .frame(width: radius * 0.4, height: radius * 0.4)

                    // Floating Spirit Level Bubble
                    ZStack {
                        Circle()
                            .fill(
                                motionService.isDeviceFlat
                                ? RadialGradient(colors: [.white, .teal], center: .center, startRadius: 2, endRadius: 20)
                                : RadialGradient(colors: [.white, .red], center: .center, startRadius: 2, endRadius: 20)
                            )
                            .frame(width: 44, height: 44)
                            .shadow(color: (motionService.isDeviceFlat ? Color.teal : Color.red).opacity(0.9), radius: 12)
                    }
                    .offset(x: max(-radius + 22, min(radius - 22, offsetX)), y: max(-radius + 22, min(radius - 22, offsetY)))
                    .animation(.spring(response: 0.15, dampingFraction: 0.7), value: offsetX)

                    // Status Banner
                    VStack {
                        Spacer()
                        HStack(spacing: 8) {
                            Image(systemName: motionService.isDeviceFlat ? "checkmark.shield.fill" : "exclamationmark.triangle.fill")
                            Text(motionService.isDeviceFlat ? "PERFECT BALANCE — HOLD PALM STILL!" : "⚠️ TILT DETECTED — FLATTEN PHONE ON PALM!")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .foregroundColor(motionService.isDeviceFlat ? Color.emerald : Color.red)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            Capsule().fill(motionService.isDeviceFlat ? Color.emerald.opacity(0.2) : Color.red.opacity(0.2))
                        )
                        .overlay(
                            Capsule().stroke(motionService.isDeviceFlat ? Color.emerald.opacity(0.4) : Color.red.opacity(0.4), lineWidth: 1)
                        )
                        .padding(.bottom, 16)
                    }
                }
            }
            .aspectRatio(1.0, contentMode: .fit)
            .padding(.horizontal)
        }
        .onReceive(Timer.publish(every: 0.1, on: .main, in: .common).autoconnect()) { _ in
            if phase == .active {
                if timeLeft > 0.1 {
                    timeLeft -= 0.1
                } else {
                    finishTest()
                }
            }
        }
    }

    private var completedView: View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 64))
                .foregroundColor(.teal)
            Text("Palm Balance Test Complete!")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            Text("Advancing to next test...")
                .font(.caption)
                .foregroundColor(.gray)
        }
    }

    private func startTest() {
        timeLeft = testDuration
        phase = .active
        motionService.startMonitoring()
    }

    private func finishTest() {
        phase = .completed
        let result = motionService.stopMonitoring()

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            onComplete(result)
        }
    }
}
