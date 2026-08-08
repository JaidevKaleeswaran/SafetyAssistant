import SwiftUI

public struct ProgressBarView: View {
    public var currentStep: Int
    public let stepLabels = ["Object Tracking", "Palm Balance", "Emoji Memory", "Pattern", "Voice AI", "Signal Light"]

    public init(currentStep: Int) {
        self.currentStep = currentStep
    }

    public var body: some View {
        VStack(spacing: 8) {
            HStack {
                ForEach(0..<stepLabels.count, id: \.self) { idx in
                    Text(stepLabels[idx])
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(idx <= currentStep ? Color.blue : Color.gray)
                        .frame(maxWidth: .infinity)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.1))
                        .frame(height: 8)
                    Capsule()
                        .fill(LinearGradient(colors: [Color.blue, Color.teal], startPoint: .leading, endPoint: .trailing))
                        .frame(width: geo.size.width * CGFloat(currentStep + 1) / CGFloat(stepLabels.count), height: 8)
                        .animation(.easeInOut(duration: 0.4), value: currentStep)
                }
            }
            .frame(height: 8)

            HStack(spacing: 4) {
                Text("Phase \(currentStep + 1) of \(stepLabels.count):")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(stepLabels[min(currentStep, stepLabels.count - 1)])
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
        }
        .padding(.horizontal)
    }
}
