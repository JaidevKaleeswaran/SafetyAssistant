import SwiftUI

public struct ResultsView: View {
    public var result: AssessmentResult
    public var onDone: () -> Void

    private var isImpaired: Bool {
        result.verdict != .sober
    }

    public init(result: AssessmentResult, onDone: @escaping () -> Void) {
        self.result = result
        self.onDone = onDone
    }

    public var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.1).ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    // Top Hero Banner Card
                    VStack(spacing: 16) {
                        VStack(spacing: 4) {
                            Text("AI ASSESSMENT RESULT")
                                .font(.system(size: 11, weight: .black))
                                .foregroundColor(isImpaired ? .red : .emerald)
                                .tracking(2)

                            Text(isImpaired ? "Avoid Driving" : "Clear to Drive")
                                .font(.system(size: 34, weight: .black, design: .rounded))
                                .foregroundColor(isImpaired ? .red : .emerald)

                            Text(isImpaired ? "Your performance shows significant deviations from your normal baseline." : "Your performance aligns with your normal baseline.")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }

                        HStack(spacing: 20) {
                            ConfidenceRingView(
                                value: result.weightedScore,
                                color: isImpaired ? .red : .emerald,
                                size: 120,
                                strokeWidth: 8,
                                label: "SOBER"
                            )

                            VStack(alignment: .leading, spacing: 10) {
                                bulletPoint(icon: "brain.head.profile", text: isImpaired ? "Multiple cognitive indicators deviated" : "Cognitive indicators aligned with baseline")
                                bulletPoint(icon: "shield.exclamationmark", text: isImpaired ? "For your safety and others" : "Safe to drive — stay alert")
                                bulletPoint(icon: "car.fill", text: isImpaired ? "Choose safe alternative transport" : "Drive responsibly")
                            }
                        }
                    }
                    .padding(20)
                    .background(
                        RoundedRectangle(cornerRadius: 28)
                            .fill(isImpaired ? Color.red.opacity(0.12) : Color.emerald.opacity(0.12))
                            .overlay(RoundedRectangle(cornerRadius: 28).stroke(isImpaired ? Color.red.opacity(0.4) : Color.emerald.opacity(0.4), lineWidth: 1.5))
                    )

                    // Performance Breakdown Bars
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Performance Summary")
                            .font(.system(size: 16, weight: .black))
                            .foregroundColor(.white)

                        scoreBar(title: "Moving Target Tracking", score: result.testScores.drawing, icon: "target")
                        scoreBar(title: "Palm Balance Stability", score: result.testScores.balance, icon: "gyroscope")
                        scoreBar(title: "Emoji Memory Recall", score: result.testScores.emojiMemory, icon: "brain")
                        scoreBar(title: "Visual Pattern Memory", score: result.testScores.gridMemory, icon: "square.grid.3x3")
                        scoreBar(title: "Voice & Articulation", score: result.testScores.voice, icon: "mic")
                        scoreBar(title: "Signal Light Reaction", score: result.testScores.signalLight, icon: "bolt.fill")
                    }
                    .padding(20)
                    .background(RoundedRectangle(cornerRadius: 28).fill(Color.white.opacity(0.06)))

                    // AI Recommendation Banner
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 6) {
                            Image(systemName: "sparkles")
                                .foregroundColor(.blue)
                            Text("AI RECOMMENDATION")
                                .font(.system(size: 11, weight: .black))
                                .foregroundColor(.blue)
                                .tracking(1)
                        }

                        Text(result.summary)
                            .font(.system(size: 14))
                            .foregroundColor(Color.gray)
                            .lineSpacing(4)
                    }
                    .padding(20)
                    .background(RoundedRectangle(cornerRadius: 28).fill(Color.blue.opacity(0.1)))

                    // Ride Options if impaired
                    if isImpaired {
                        RideOptionsView()
                    }

                    // Reset Action
                    Button(action: onDone) {
                        HStack(spacing: 8) {
                            Image(systemName: "arrow.counterclockwise")
                            Text("Start New Assessment")
                        }
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 64)
                        .background(Color.blue)
                        .cornerRadius(28)
                        .shadow(color: Color.blue.opacity(0.4), radius: 15)
                    }
                    .padding(.top, 10)

                    Text("Safety Assistant does not measure BAC, diagnose impairment, or determine legal fitness to drive.")
                        .font(.system(size: 10))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.bottom, 20)
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
            }
        }
    }

    private func bulletPoint(icon: String, text: String) -> View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundColor(isImpaired ? .red : .emerald)
                .frame(width: 24, height: 24)
                .background(Circle().fill((isImpaired ? Color.red : Color.emerald).opacity(0.2)))
            Text(text)
                .font(.system(size: 11))
                .foregroundColor(Color.gray)
        }
    }

    private func scoreBar(title: String, score: Double, icon: String) -> View {
        let barColor: Color = score >= 80 ? .emerald : (score >= 50 ? .amber : .red)
        return VStack(spacing: 6) {
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: icon)
                        .font(.system(size: 12))
                        .foregroundColor(barColor)
                    Text(title)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                }
                Spacer()
                Text("\(Int(score))%")
                    .font(.system(size: 14, weight: .black))
                    .foregroundColor(barColor)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.1)).frame(height: 6)
                    Capsule().fill(barColor).frame(width: geo.size.width * CGFloat(score / 100.0), height: 6)
                }
            }
            .frame(height: 6)
        }
    }
}
