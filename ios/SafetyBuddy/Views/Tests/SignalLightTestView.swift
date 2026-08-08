import SwiftUI
import AVFoundation

public struct SignalLightTestView: View {
    public var onComplete: (SignalLightResult) -> Void

    @State private var phase: Phase = .intro
    @State private var currentRound: Int = 0
    @State private var targetColor: LightCommand = .red
    @State private var isPlayingAudio: Bool = false
    @State private var canTap: Bool = false
    @State private var lastFeedback: Feedback? = nil
    @State private var roundsHistory: [SignalLightRound] = []
    @State private var roundStartTime: Date = Date()

    private let synthesizer = AVSpeechSynthesizer()

    enum Phase {
        case intro
        case active
        case completed
    }

    struct Feedback {
        let correct: Bool
        let reactionMs: Double
        let selected: LightCommand?
    }

    public init(onComplete: @escaping (SignalLightResult) -> Void) {
        self.onComplete = onComplete
    }

    public var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.1).ignoresSafeArea()

            switch phase {
            case .intro:
                introView
            case .active:
                activeView
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
                Text("Signal Light Reaction")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("Listen for the spoken light color and tap the matching circle")
                    .font(.system(size: 16))
                    .foregroundColor(Color.gray)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            VStack(spacing: 12) {
                ZStack {
                    Circle().fill(Color.blue).frame(width: 48, height: 48)
                    Text("STOP").font(.system(size: 10, weight: .black)).foregroundColor(.white)
                }
                ZStack {
                    Circle().fill(Color.blue).frame(width: 48, height: 48)
                    Text("SLOW").font(.system(size: 10, weight: .black)).foregroundColor(.white)
                }
                ZStack {
                    Circle().fill(Color.blue).frame(width: 48, height: 48)
                    Text("GO").font(.system(size: 10, weight: .black)).foregroundColor(.white)
                }
            }
            .padding(28)
            .background(RoundedRectangle(cornerRadius: 32).fill(Color.white.opacity(0.06)))

            Spacer()

            Button(action: startTest) {
                HStack(spacing: 8) {
                    Text("Start Signal Test Now")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 18, weight: .bold))
                }
                .foregroundColor(Color(red: 0.05, green: 0.1, blue: 0.15))
                .frame(maxWidth: .infinity)
                .frame(height: 68)
                .background(Color.amber)
                .cornerRadius(34)
                .shadow(color: Color.amber.opacity(0.6), radius: 18, x: 0, y: 6)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
        }
    }

    private var activeView: View {
        VStack(spacing: 24) {
            // Header
            HStack {
                Text("Round \(currentRound + 1) of \(AssessmentConstants.signalLightRounds)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.teal)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(Color.white.opacity(0.08)))

                Spacer()

                Button(action: { speakCommand(targetColor) }) {
                    HStack(spacing: 4) {
                        Image(systemName: "speaker.wave.2.fill")
                        Text("Replay Voice")
                    }
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(Color.white.opacity(0.06)))
                }
            }
            .padding(.horizontal, 24)

            // Target Circle Display
            VStack(spacing: 8) {
                Text("TARGET SIGNAL")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.gray)
                    .tracking(2)

                Circle()
                    .fill(targetColor == .red ? Color.red : (targetColor == .yellow ? Color.amber : Color.emerald))
                    .frame(width: 100, height: 100)
                    .shadow(color: (targetColor == .red ? Color.red : (targetColor == .yellow ? Color.amber : Color.emerald)).opacity(0.8), radius: 20)
            }

            Spacer()

            // 3 Action Buttons (STOP, SLOW, GO)
            HStack(spacing: 16) {
                actionCircle(cmd: .red, label: "STOP")
                actionCircle(cmd: .yellow, label: "SLOW")
                actionCircle(cmd: .green, label: "GO")
            }
            .padding(.horizontal, 24)

            // Feedback Message
            HStack {
                if let fb = lastFeedback {
                    Image(systemName: fb.correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundColor(fb.correct ? .emerald : .red)
                    Text(fb.correct ? "Correct Signal! (\(Int(fb.reactionMs)) ms)" : "Wrong Signal!")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(fb.correct ? .emerald : .red)
                } else {
                    Text(canTap ? "Tap the matching signal light!" : "Listening to Voice Command...")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            .frame(height: 32)
            .padding(.bottom, 24)
        }
    }

    private var completedView: View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(.emerald)
            Text("Signal Test Complete!")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
    }

    private func actionCircle(cmd: LightCommand, label: String) -> View {
        Button(action: { handleTap(cmd) }) {
            ZStack {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 90, height: 90)
                    .shadow(color: Color.blue.opacity(0.6), radius: 12)
                Text(label)
                    .font(.system(size: 16, weight: .black))
                    .foregroundColor(.white)
            }
        }
        .disabled(!canTap)
    }

    private func startTest() {
        roundsHistory = []
        startRound(roundIndex: 0)
    }

    private func startRound(roundIndex: Int) {
        let options: [LightCommand] = [.red, .yellow, .green]
        targetColor = options.randomElement() ?? .red
        currentRound = roundIndex
        lastFeedback = nil
        phase = .active

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            speakCommand(targetColor)
        }
    }

    private func speakCommand(_ color: LightCommand) {
        isPlayingAudio = true
        canTap = false

        let phrase: String
        switch color {
        case .red: phrase = "Red Light"
        case .yellow: phrase = "Yellow Light"
        case .green: phrase = "Green Light"
        }

        let utterance = AVSpeechUtterance(string: phrase)
        utterance.rate = 0.5
        synthesizer.speak(utterance)

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            isPlayingAudio = false
            canTap = true
            roundStartTime = Date()
        }
    }

    private func handleTap(_ selected: LightCommand) {
        guard canTap else { return }
        canTap = false

        let reactionMs = Date().timeIntervalSince(roundStartTime) * 1000.0
        let correct = (selected == targetColor)

        let roundData = SignalLightRound(command: targetColor, selected: selected, correct: correct, reactionTimeMs: reactionMs)
        roundsHistory.append(roundData)

        lastFeedback = Feedback(correct: correct, reactionMs: reactionMs, selected: selected)

        let nextIdx = currentRound + 1
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            if nextIdx < AssessmentConstants.signalLightRounds {
                startRound(roundIndex: nextIdx)
            } else {
                phase = .completed
                finishTest()
            }
        }
    }

    private func finishTest() {
        let correctCount = roundsHistory.filter { $0.correct }.count
        let acc = Double(correctCount) / Double(AssessmentConstants.signalLightRounds) * 100.0
        let correctRounds = roundsHistory.filter { $0.correct }
        let avgReaction = correctRounds.isEmpty ? 2000.0 : (correctRounds.reduce(0.0) { $0 + $1.reactionTimeMs } / Double(correctRounds.count))

        let result = SignalLightResult(
            accuracy: acc,
            avgReactionTime: avgReaction,
            rounds: roundsHistory,
            wrongTaps: AssessmentConstants.signalLightRounds - correctCount
        )

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            onComplete(result)
        }
    }
}
