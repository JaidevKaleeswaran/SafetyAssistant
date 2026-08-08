import SwiftUI

public struct CountdownRingView: View {
    public var progress: Double // 0.0 to 1.0
    public var seconds: Int
    public var size: CGFloat = 140
    public var strokeWidth: CGFloat = 6
    public var ringColor: Color = Color.blue

    public init(progress: Double, seconds: Int, size: CGFloat = 140, strokeWidth: CGFloat = 6, ringColor: Color = Color.blue) {
        self.progress = progress
        self.seconds = seconds
        self.size = size
        self.strokeWidth = strokeWidth
        self.ringColor = ringColor
    }

    public var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.1), lineWidth: strokeWidth)
            Circle()
                .trim(from: 0, to: CGFloat(max(0.0, min(1.0, progress))))
                .stroke(ringColor, style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .shadow(color: ringColor.opacity(0.4), radius: 6, x: 0, y: 0)
                .animation(.linear(duration: 0.1), value: progress)
            Text("\(seconds)")
                .font(.system(size: size * 0.28, weight: .bold, design: .rounded))
                .foregroundColor(.white)
        }
        .frame(width: size, height: size)
    }
}
