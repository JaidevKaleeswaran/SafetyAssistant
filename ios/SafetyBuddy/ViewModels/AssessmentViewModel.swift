import SwiftUI
import Combine

@MainActor
public final class AssessmentViewModel: ObservableObject {
    @Published public var state: AssessmentState = AssessmentState()

    public init() {}

    public var currentStep: TestStep {
        TestStep(rawValue: state.currentStep) ?? .drawing
    }

    public func setDrawingResult(_ result: DrawingTestResult) {
        state.drawingResult = result
        state.eyeContactResult = result
    }

    public func setBalanceResult(_ result: BalanceTestResult) {
        state.balanceResult = result
    }

    public func setEmojiResult(_ result: EmojiMemoryResult) {
        state.emojiResult = result
    }

    public func setGridResult(_ result: GridMemoryResult) {
        state.gridResult = result
    }

    public func setVoiceResult(_ result: VoiceTestResult) {
        state.voiceResult = result
    }

    public func setSignalLightResult(_ result: SignalLightResult) {
        state.signalLightResult = result
        computeFinalResult()
    }

    public func nextStep() {
        if state.currentStep < TestStep.allCases.count - 1 {
            state.currentStep += 1
        }
    }

    public func computeFinalResult() {
        guard let drawing = state.drawingResult,
              let balance = state.balanceResult,
              let emoji = state.emojiResult,
              let grid = state.gridResult,
              let voice = state.voiceResult,
              let signal = state.signalLightResult else { return }

        state.finalResult = ScoringEngine.calculateAssessment(
            drawing: drawing,
            balance: balance,
            emoji: emoji,
            grid: grid,
            voice: voice,
            signalLight: signal
        )
    }

    public func reset() {
        state = AssessmentState()
    }
}
