import SwiftUI

public struct EmojiMemoryTestView: View {
    public var onComplete: (EmojiMemoryResult) -> Void

    @State private var phase: Phase = .intro
    @State private var round: Int = 0
    @State private var targetEmojis: [String] = []
    @State private var choiceEmojis: [String] = []
    @State private var selectedEmojis: [String] = []
    @State private var roundResults: [MemoryRound] = []
    @State private var totalMistakes: Int = 0
    @State private var roundStartTime: Date = Date()
    @State private var progressWidth: Double = 1.0

    enum Phase {
        case intro
        case display
        case recall
        case feedback
        case done
    }

    public init(onComplete: @escaping (EmojiMemoryResult) -> Void) {
        self.onComplete = onComplete
    }

    public var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.1).ignoresSafeArea()

            switch phase {
            case .intro:
                introView
            case .display:
                displayView
            case .recall:
                recallView
            case .feedback:
                feedbackView
            case .done:
                doneView
            }
        }
    }

    private var introView: View {
        VStack(spacing: 20) {
            // 7-Second Decreasing Auto-Start Progress Bar
            AutoStartTimerBarView(duration: AssessmentConstants.autoStartDurationSec) {
                startRound()
            }

            VStack(spacing: 8) {
                Text("Emoji Memory")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("Memorize the emojis and their order, then select them back")
                    .font(.system(size: 16))
                    .foregroundColor(Color.gray)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            ZStack {
                RoundedRectangle(cornerRadius: 36)
                    .fill(LinearGradient(colors: [Color.purple.opacity(0.3), Color.pink.opacity(0.2)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 210, height: 210)
                    .overlay(
                        RoundedRectangle(cornerRadius: 36)
                            .stroke(Color.purple.opacity(0.8), lineWidth: 2)
                    )
                    .shadow(color: Color.purple.opacity(0.4), radius: 25)

                Image(systemName: "brain.head.profile")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 95, height: 95)
                    .foregroundColor(.purple)
            }

            Spacer()

            Button(action: startRound) {
                HStack(spacing: 8) {
                    Text("Start Emoji Test Now")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 18, weight: .bold))
                }
                .foregroundColor(Color(red: 0.05, green: 0.1, blue: 0.15))
                .frame(maxWidth: .infinity)
                .frame(height: 68)
                .background(Color.purple)
                .cornerRadius(34)
                .shadow(color: Color.purple.opacity(0.6), radius: 18, x: 0, y: 6)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
        }
    }

    private var displayView: View {
        VStack(spacing: 24) {
            VStack(spacing: 4) {
                Text("Memorize these emojis!")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                Text("Round \(round + 1) of \(AssessmentConstants.emojiRounds)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            HStack(spacing: 12) {
                ForEach(0..<targetEmojis.count, id: \.self) { i in
                    VStack(spacing: 6) {
                        Text("#\(i + 1)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.teal)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Capsule().fill(Color.black.opacity(0.6)))
                        Text(targetEmojis[i])
                            .font(.system(size: 44))
                            .frame(width: 68, height: 68)
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(18)
                            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.teal, lineWidth: 2))
                    }
                }
            }
            .padding()
            .background(Color.white.opacity(0.05))
            .cornerRadius(24)

            // Timer bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.1)).frame(height: 8)
                    Capsule().fill(Color.teal).frame(width: geo.size.width * progressWidth, height: 8)
                }
            }
            .frame(height: 8)
            .padding(.horizontal, 36)
        }
    }

    private var recallView: View {
        VStack(spacing: 24) {
            VStack(spacing: 4) {
                Text("Select them in order")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                Text("Round \(round + 1) of \(AssessmentConstants.emojiRounds)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            // Target slots
            HStack(spacing: 12) {
                ForEach(0..<AssessmentConstants.emojiCount, id: \.self) { i in
                    ZStack {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(i < selectedEmojis.count ? Color.blue.opacity(0.3) : Color.white.opacity(0.05))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(i < selectedEmojis.count ? Color.blue : Color.white.opacity(0.2), lineWidth: 2)
                            )
                            .frame(width: 60, height: 60)

                        if i < selectedEmojis.count {
                            Text(selectedEmojis[i])
                                .font(.system(size: 32))
                        } else {
                            Text("#\(i + 1)")
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                    }
                }
            }

            // Grid of choices
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
                ForEach(choiceEmojis, id: \.self) { emoji in
                    Button(action: { handleSelect(emoji) }) {
                        Text(emoji)
                            .font(.system(size: 36))
                            .frame(maxWidth: .infinity)
                            .frame(height: 72)
                            .background(selectedEmojis.contains(emoji) ? Color.blue.opacity(0.4) : Color.white.opacity(0.08))
                            .cornerRadius(18)
                            .overlay(
                                RoundedRectangle(cornerRadius: 18)
                                    .stroke(selectedEmojis.contains(emoji) ? Color.blue : Color.white.opacity(0.15), lineWidth: 1.5)
                            )
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    private var feedbackView: View {
        VStack(spacing: 16) {
            if let last = roundResults.last {
                Text("\(last.correct)/\(AssessmentConstants.emojiCount)")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.white)
                Text(last.correct == AssessmentConstants.emojiCount ? "🎉 Perfect!" : "👍 Keep going!")
                    .font(.title3)
                    .foregroundColor(.gray)
            }
        }
    }

    private var doneView: View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 64))
                .foregroundColor(.purple)
            Text("Emoji Memory Complete!")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
    }

    private func startRound() {
        let targets = Array(AssessmentConstants.emojiPool.shuffled().prefix(AssessmentConstants.emojiCount))
        targetEmojis = targets
        selectedEmojis = []

        let remaining = AssessmentConstants.emojiPool.filter { !targets.contains($0) }
        let distractors = Array(remaining.shuffled().prefix(AssessmentConstants.emojiCount))
        choiceEmojis = (targets + distractors).shuffled()

        phase = .display
        progressWidth = 1.0

        withAnimation(.linear(duration: AssessmentConstants.emojiDisplayTimeMs / 1000.0)) {
            progressWidth = 0.0
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + (AssessmentConstants.emojiDisplayTimeMs / 1000.0)) {
            phase = .recall
            roundStartTime = Date()
        }
    }

    private func handleSelect(_ emoji: String) {
        if selectedEmojis.contains(emoji) {
            selectedEmojis.removeAll { $0 == emoji }
            return
        }
        guard selectedEmojis.count < AssessmentConstants.emojiCount else { return }
        selectedEmojis.append(emoji)

        if selectedEmojis.count == AssessmentConstants.emojiCount {
            finishRound()
        }
    }

    private func finishRound() {
        let timeTaken = Date().timeIntervalSince(roundStartTime)
        var correct = 0
        var mistakes = 0

        for (i, sel) in selectedEmojis.enumerated() {
            if i < targetEmojis.count && sel == targetEmojis[i] {
                correct += 1
            } else {
                mistakes += 1
            }
        }

        totalMistakes += mistakes
        let roundRes = MemoryRound(correct: correct, total: AssessmentConstants.emojiCount, time: timeTaken)
        roundResults.append(roundRes)

        phase = .feedback

        let nextRound = round + 1
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            if nextRound >= AssessmentConstants.emojiRounds {
                phase = .done
                let avgAcc = roundResults.reduce(0.0) { $0 + (Double($1.correct) / Double($1.total) * 100.0) } / Double(roundResults.count)
                let avgTime = roundResults.reduce(0.0) { $0 + $1.time } / Double(roundResults.count)

                let finalResult = EmojiMemoryResult(
                    accuracy: avgAcc,
                    timeTaken: avgTime,
                    mistakes: totalMistakes,
                    rounds: roundResults
                )
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    onComplete(finalResult)
                }
            } else {
                round = nextRound
                startRound()
            }
        }
    }
}
