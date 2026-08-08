import SwiftUI

@main
struct SafetyBuddyApp: App {
    @StateObject private var viewModel = AssessmentViewModel()
    @State private var isAssessing = false

    var body: some Scene {
        WindowGroup {
            ZStack {
                Color(red: 0.04, green: 0.06, blue: 0.1).ignoresSafeArea()

                if isAssessing || viewModel.state.currentStep > 0 || viewModel.state.finalResult != nil {
                    AssessmentFlowView(viewModel: viewModel)
                        .transition(.opacity)
                } else {
                    LandingView {
                        withAnimation(.easeInOut(duration: 0.5)) {
                            isAssessing = true
                        }
                    }
                    .transition(.opacity)
                }
            }
            .preferredColorScheme(.dark)
        }
    }
}
