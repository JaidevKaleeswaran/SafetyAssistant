import SwiftUI

public struct AssessmentFlowView: View {
    @ObservedObject var viewModel: AssessmentViewModel

    public init(viewModel: AssessmentViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.1).ignoresSafeArea()

            if let result = viewModel.state.finalResult {
                ResultsView(result: result, onDone: {
                    viewModel.reset()
                })
            } else {
                VStack(spacing: 16) {
                    // Header progress bar
                    ProgressBarView(currentStep: viewModel.state.currentStep)
                        .padding(.top, 12)

                    // Current Test Step
                    switch viewModel.currentStep {
                    case .drawing:
                        DrawingTestView { res in
                            viewModel.setDrawingResult(res)
                            viewModel.nextStep()
                        }
                    case .balance:
                        BalanceTestView { res in
                            viewModel.setBalanceResult(res)
                            viewModel.nextStep()
                        }
                    case .emoji:
                        EmojiMemoryTestView { res in
                            viewModel.setEmojiResult(res)
                            viewModel.nextStep()
                        }
                    case .grid:
                        GridMemoryTestView { res in
                            viewModel.setGridResult(res)
                            viewModel.nextStep()
                        }
                    case .voice:
                        VoiceTestView { res in
                            viewModel.setVoiceResult(res)
                            viewModel.nextStep()
                        }
                    case .signalLight:
                        SignalLightTestView { res in
                            viewModel.setSignalLightResult(res)
                        }
                    }
                }
            }
        }
    }
}
