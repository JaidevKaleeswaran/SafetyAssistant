import SwiftUI

public struct GridMemoryTestView: View {
    public var onComplete: (GridMemoryResult) -> Void

    @State private var phase: Phase = .intro
    @State private var round: Int = 0
    @State private var highlightedCells: [Int] = []
    @State private var selectedCells: [Int] = []
    @State private var roundResults: [MemoryRound] = []
    @State private var totalMistakes: Int = 0
    @State private var recallTimeLeft: Int = Int(AssessmentConstants.recallTimeLimitSec)
    @State private var displayProgress: Double = 1.0
    @State private var roundStartTime: Date = Date()

    private let totalCells = AssessmentConstants.gridSize * AssessmentConstants.gridSize

    enum Phase {
        case intro
        case display
        case recall
        case feedback
        case done
    }

    public init(onComplete: @escaping (GridMemoryResult) -> Void) {
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
                Text("Pattern Memory")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("Memorize which green squares light up, then recreate the pattern")
                    .font(.system(size: 16))
                    .foregroundColor(Color.gray)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            ZStack {
                RoundedRectangle(cornerRadius: 36)
                    .fill(LinearGradient(colors: [Color.emerald.opacity(0.3), Color.teal.opacity(0.2)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 210, height: 210)
                    .overlay(
                        RoundedRectangle(cornerRadius: 36)
                            .stroke(Color.emerald.opacity(0.8), lineWidth: 2)
                    )
                    .shadow(color: Color.emerald.opacity(0.4), radius: 25)

                Image(systemName: "square.grid.3x3.fill")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 90, height: 90)
                    .foregroundColor(.emerald)
            }

            Spacer()

            Button(action: startRound) {
                HStack(spacing: 8) {
                    Text("Start Pattern Test Now")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 18, weight: .bold))
                }
                .foregroundColor(Color(red: 0.05, green: 0.1, blue: 0.15))
                .frame(maxWidth: .infinity)
                .frame(height: 68)
                .background(Color.emerald)
                .cornerRadius(34)
                .shadow(color: Color.emerald.opacity(0.6), radius: 18, x: 0, y: 6)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
        }
    }

    private var displayView: View {
        VStack(spacing: 20) {
            VStack(spacing: 4) {
                Text("Memorize the pattern")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                Text("Round \(round + 1) of \(AssessmentConstants.gridRounds)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            CountdownRingView(
                progress: displayProgress,
                seconds: Int(ceil(displayProgress * (AssessmentConstants.gridDisplayTimeMs / 1000.0))),
                size: 90,
                strokeWidth: 5,
                ringColor: .emerald
            )

            gridMatrix(isInteractive: false)
                .padding(.horizontal, 24)
        }
    }

    private var recallView: View {
        VStack(spacing: 20) {
            VStack(spacing: 4) {
                Text("Recreate the pattern")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                Text("Round \(round + 1) of \(AssessmentConstants.gridRounds)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            Text("⏱️ Time Limit: \(recallTimeLeft)s")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.emerald)
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(Capsule().fill(Color.white.opacity(0.08)))

            gridMatrix(isInteractive: true)
                .padding(.horizontal, 24)

            Button(action: executeSubmit) {
                HStack(spacing: 8) {
                    Text("Submit Pattern")
                    Text("\(selectedCells.count)/\(AssessmentConstants.gridHighlightCount)")
                        .font(.system(size: 12, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color.black.opacity(0.3)))
                }
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 64)
                .background(selectedCells.isEmpty ? Color.gray.opacity(0.3) : Color.emerald)
                .cornerRadius(24)
                .shadow(color: selectedCells.isEmpty ? .clear : Color.emerald.opacity(0.5), radius: 15)
            }
            .disabled(selectedCells.isEmpty)
            .padding(.horizontal, 24)
        }
        .onReceive(Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()) { _ in
            if phase == .recall {
                if recallTimeLeft > 1 {
                    recallTimeLeft -= 1
                } else {
                    executeSubmit()
                }
            }
        }
    }

    private var feedbackView: View {
        VStack(spacing: 20) {
            if let last = roundResults.last {
                Text("\(last.correct)/\(AssessmentConstants.gridHighlightCount) Correct")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)
            }
        }
    }

    private var doneView: View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(.emerald)
            Text("Pattern Memory Complete!")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
    }

    private func gridMatrix(isInteractive: Bool) -> View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 12), count: AssessmentConstants.gridSize)
        return LazyVGrid(columns: columns, spacing: 12) {
            ForEach(0..<totalCells, id: \.self) { idx in
                let isHighlighted = (phase == .display && highlightedCells.contains(idx))
                let isSelected = (phase == .recall && selectedCells.contains(idx))

                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        isHighlighted ? Color.emerald : (isSelected ? Color.teal : Color.white.opacity(0.08))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isHighlighted ? Color.white : (isSelected ? Color.teal : Color.white.opacity(0.15)), lineWidth: 2)
                    )
                    .aspectRatio(1.0, contentMode: .fit)
                    .shadow(color: isHighlighted ? Color.emerald.opacity(0.8) : .clear, radius: 10)
                    .onTapGesture {
                        if isInteractive {
                            handleCellTap(idx)
                        }
                    }
            }
        }
    }

    private func startRound() {
        var positions: [Int] = []
        while positions.count < AssessmentConstants.gridHighlightCount {
            let rnd = Int.random(in: 0..<totalCells)
            if !positions.contains(rnd) { positions.append(rnd) }
        }
        highlightedCells = positions
        selectedCells = []
        phase = .display
        displayProgress = 1.0

        withAnimation(.linear(duration: AssessmentConstants.gridDisplayTimeMs / 1000.0)) {
            displayProgress = 0.0
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + (AssessmentConstants.gridDisplayTimeMs / 1000.0)) {
            phase = .recall
            recallTimeLeft = Int(AssessmentConstants.recallTimeLimitSec)
            roundStartTime = Date()
        }
    }

    private func handleCellTap(_ idx: Int) {
        if selectedCells.contains(idx) {
            selectedCells.removeAll { $0 == idx }
        } else if selectedCells.count < AssessmentConstants.gridHighlightCount {
            selectedCells.append(idx)
        }
    }

    private func executeSubmit() {
        guard phase == .recall else { return }
        let timeTaken = Date().timeIntervalSince(roundStartTime)
        let correct = selectedCells.filter { highlightedCells.contains($0) }.count
        let mistakes = selectedCells.filter { !highlightedCells.contains($0) }.count

        totalMistakes += mistakes
        let roundRes = MemoryRound(correct: correct, total: AssessmentConstants.gridHighlightCount, time: timeTaken)
        roundResults.append(roundRes)

        phase = .feedback

        let nextRound = round + 1
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            if nextRound >= AssessmentConstants.gridRounds {
                phase = .done
                let avgAcc = roundResults.reduce(0.0) { $0 + (Double($1.correct) / Double($1.total) * 100.0) } / Double(roundResults.count)
                let avgTime = roundResults.reduce(0.0) { $0 + $1.time } / Double(roundResults.count)

                let finalResult = GridMemoryResult(
                    accuracy: avgAcc,
                    completionTime: avgTime,
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
