import SwiftUI

public struct DrawingTestView: View {
    public var onComplete: (DrawingTestResult) -> Void

    @State private var phase: TestPhase = .intro
    @State private var timeLeft: Double = 10.0
    @State private var isInside: Bool = false
    @State private var liveAccuracy: Int = 100
    @State private var lostTargetCount: Int = 0

    @State private var boxPosition: CGPoint = CGPoint(x: 150, y: 150)
    @State private var touchLocation: CGPoint? = nil
    @State private var totalTicks: Int = 0
    @State private var insideTicks: Int = 0
    @State private var wasInside: Bool = false
    @State private var startTime: Date = Date()

    private let boxSize: CGFloat = 92
    private let testDuration: Double = 10.0

    enum TestPhase {
        case intro
        case active
        case completed
    }

    public init(onComplete: @escaping (DrawingTestResult) -> Void) {
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
                Text("Object Tracking")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("Keep your finger inside your glowing target box")
                    .font(.system(size: 16))
                    .foregroundColor(Color.gray)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            // Concentric reticle ring badge
            ZStack {
                RoundedRectangle(cornerRadius: 36)
                    .fill(LinearGradient(colors: [Color.emerald.opacity(0.3), Color.teal.opacity(0.2)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 210, height: 210)
                    .overlay(
                        RoundedRectangle(cornerRadius: 36)
                            .stroke(Color.emerald.opacity(0.8), lineWidth: 2)
                    )
                    .shadow(color: Color.emerald.opacity(0.4), radius: 25, x: 0, y: 0)

                ZStack {
                    Circle().stroke(Color.white, lineWidth: 4).frame(width: 120, height: 120)
                    Circle().stroke(Color.white, lineWidth: 4).frame(width: 80, height: 80)
                    Circle().stroke(Color.white, lineWidth: 4).frame(width: 40, height: 40)
                    Circle().fill(Color.white).frame(width: 14, height: 14)
                }
            }

            Spacer()

            Button(action: startTest) {
                HStack(spacing: 8) {
                    Text("Start Test Now")
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
                        ringColor: isInside ? Color.teal : Color.red
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
                    Text("TRACKING ACCURACY")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.gray)
                    Text("\(liveAccuracy)%")
                        .font(.system(size: 18, weight: .black))
                        .foregroundColor(liveAccuracy >= 80 ? .emerald : .red)
                }
            }
            .padding()
            .background(Color.white.opacity(0.06))
            .cornerRadius(20)
            .padding(.horizontal)

            // Tracking Canvas Container
            GeometryReader { geo in
                let containerSize = geo.size
                ZStack {
                    RoundedRectangle(cornerRadius: 28)
                        .fill(isInside ? Color.black.opacity(0.8) : Color.red.opacity(0.1))
                        .overlay(
                            RoundedRectangle(cornerRadius: 28)
                                .stroke(isInside ? Color.emerald : Color.red, lineWidth: 2)
                        )
                        .shadow(color: (isInside ? Color.emerald : Color.red).opacity(0.4), radius: 20)

                    // Target Box
                    ZStack {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(
                                isInside
                                ? LinearGradient(colors: [.teal, .emerald], startPoint: .topLeading, endPoint: .bottomTrailing)
                                : LinearGradient(colors: [Color.gray.opacity(0.3), Color.black.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(isInside ? Color.emerald : Color.red, lineWidth: 2)
                            )
                            .shadow(color: (isInside ? Color.teal : Color.red).opacity(0.8), radius: 15)

                        Image(systemName: "scope")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(isInside ? .white : .red)
                    }
                    .frame(width: boxSize, height: boxSize)
                    .position(boxPosition)

                    // Status Banner
                    VStack {
                        Spacer()
                        HStack(spacing: 8) {
                            Image(systemName: isInside ? "target" : "exclamationmark.triangle.fill")
                            Text(isInside ? "TARGET LOCKED — KEEP FINGER INSIDE BOX!" : "TARGET LOST — MOVE FINGER ONTO BOX!")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .foregroundColor(isInside ? Color.emerald : Color.red)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            Capsule().fill(isInside ? Color.emerald.opacity(0.2) : Color.red.opacity(0.2))
                        )
                        .overlay(
                            Capsule().stroke(isInside ? Color.emerald.opacity(0.4) : Color.red.opacity(0.4), lineWidth: 1)
                        )
                        .padding(.bottom, 16)
                    }
                }
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { val in
                            touchLocation = val.location
                        }
                        .onEnded { _ in
                            touchLocation = nil
                            isInside = false
                        }
                )
                .onAppear {
                    boxPosition = CGPoint(x: containerSize.width / 2, y: containerSize.height / 2)
                }
                .onReceive(Timer.publish(every: 0.033, on: .main, in: .common).autoconnect()) { _ in
                    updatePhysics(containerSize: containerSize)
                }
            }
            .aspectRatio(1.0, contentMode: .fit)
            .padding(.horizontal)
        }
    }

    private var completedView: View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(.emerald)
            Text("Target Pursuit Complete!")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            Text("Advancing to next phase...")
                .font(.caption)
                .foregroundColor(.gray)
        }
    }

    private func startTest() {
        startTime = Date()
        timeLeft = testDuration
        liveAccuracy = 100
        isInside = false
        lostTargetCount = 0
        totalTicks = 0
        insideTicks = 0
        wasInside = false
        phase = .active
    }

    private func updatePhysics(containerSize: CGSize) {
        guard phase == .active else { return }

        let elapsed = Date().timeIntervalSince(startTime)
        let remaining = max(0.0, testDuration - elapsed)
        timeLeft = remaining

        if remaining <= 0 {
            finishTest()
            return
        }

        let t = elapsed * 0.65
        let radiusX = max(60.0, (containerSize.width - boxSize) / 2.0 - 10.0)
        let radiusY = max(60.0, (containerSize.height - boxSize) / 2.0 - 10.0)
        let centerX = containerSize.width / 2.0
        let centerY = containerSize.height / 2.0

        let newX = centerX + radiusX * sin(t * 1.2)
        let newY = centerY + radiusY * sin(t * 0.9) * cos(t * 0.4)

        boxPosition = CGPoint(x: newX, y: newY)

        totalTicks += 1
        var currentlyInside = false

        if let touch = touchLocation {
            let minX = boxPosition.x - boxSize / 2.0
            let maxX = boxPosition.x + boxSize / 2.0
            let minY = boxPosition.y - boxSize / 2.0
            let maxY = boxPosition.y + boxSize / 2.0

            if touch.x >= minX && touch.x <= maxX && touch.y >= minY && touch.y <= maxY {
                currentlyInside = true
            }
        }

        if currentlyInside {
            insideTicks += 1
            isInside = true
            wasInside = true
        } else {
            isInside = false
            if wasInside {
                lostTargetCount += 1
                wasInside = false
            }
        }

        liveAccuracy = totalTicks > 0 ? Int(round(Double(insideTicks) / Double(totalTicks) * 100.0)) : 100
    }

    private func finishTest() {
        phase = .completed
        let finalAcc = totalTicks > 0 ? Double(insideTicks) / Double(totalTicks) * 100.0 : 100.0
        let result = DrawingTestResult(
            accuracy: finalAcc,
            completionTime: testDuration,
            avgDeviationPx: max(0.0, 100.0 - finalAcc),
            offPathCount: lostTargetCount,
            passed: finalAcc >= 80.0
        )
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            onComplete(result)
        }
    }
}
