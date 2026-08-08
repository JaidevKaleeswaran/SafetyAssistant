import SwiftUI

public struct AutoStartTimerBarView: View {
    public var duration: Double = 7.0
    public var onAutoStart: () -> Void

    @State private var progress: Double = 1.0
    @State private var secondsRemaining: Int = 7
    @State private var timer: Timer? = nil

    public init(duration: Double = 7.0, onAutoStart: @escaping () -> Void) {
        self.duration = duration
        self.onAutoStart = onAutoStart
    }

    public var body: some View {
        VStack(spacing: 10) {
            // Header info above bar
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "timer")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.teal)
                    Text("AUTO-STARTING TEST IN")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(.teal)
                        .tracking(1)
                }
                Spacer()
                Text("\(secondsRemaining)s")
                    .font(.system(size: 14, weight: .black, design: .rounded))
                    .foregroundColor(.white)
            }

            // Horizontally Stretched Progress Bar (Decreasing)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // Background track
                    Capsule()
                        .fill(Color.white.opacity(0.1))
                        .frame(height: 10)

                    // Decreasing fill bar
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [Color.teal, Color.blue],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: max(0, geo.size.width * CGFloat(progress)), height: 10)
                        .shadow(color: Color.teal.opacity(0.6), radius: 6)
                }
            }
            .frame(height: 10)
            .contentShape(Rectangle())
            .onTapGesture {
                stopTimer()
                onAutoStart()
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.teal.opacity(0.3), lineWidth: 1)
                )
        )
        .onAppear {
            startTimer()
        }
        .onDisappear {
            stopTimer()
        }
    }

    private func startTimer() {
        progress = 1.0
        secondsRemaining = Int(ceil(duration))

        let startTime = Date()

        withAnimation(.linear(duration: duration)) {
            progress = 0.0
        }

        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            let elapsed = Date().timeIntervalSince(startTime)
            let remaining = max(0.0, duration - elapsed)
            secondsRemaining = Int(ceil(remaining))

            if remaining <= 0 {
                stopTimer()
                onAutoStart()
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}
