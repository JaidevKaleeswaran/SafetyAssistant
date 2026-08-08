import SwiftUI

public struct ConfidenceRingView: View {
    public var value: Double // 0 to 100
    public var color: Color
    public var size: CGFloat = 135
    public var strokeWidth: CGFloat = 9
    public var label: String = "SOBER"

    public init(value: Double, color: Color, size: CGFloat = 135, strokeWidth: CGFloat = 9, label: String = "SOBER") {
        self.value = value
        self.color = color
        self.size = size
        self.strokeWidth = strokeWidth
        self.label = label
    }

    public var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.08), lineWidth: strokeWidth)

            Circle()
                .trim(from: 0, to: CGFloat(max(0.0, min(1.0, value / 100.0))))
                .stroke(color, style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .shadow(color: color.opacity(0.5), radius: 8)

            VStack(spacing: 2) {
                Text("\(Int(value))%")
                    .font(.system(size: size * 0.24, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text(label)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Color.gray)
                    .tracking(2)
            }
        }
        .frame(width: size, height: size)
    }
}
