import SwiftUI

public struct VoiceTestView: View {
    public var onComplete: (VoiceTestResult) -> Void

    @StateObject private var speechService = SpeechRecognitionService()
    @State private var phase: TestPhase = .intro
    @State private var selectedTwisterIndex: Int = Int.random(in: 0..<AssessmentConstants.tongueTwisters.count)
    @State private var transcript: String = ""
    @State private var recordingStartTime: Date = Date()
    @State private var isListening: Bool = false

    enum TestPhase {
        case intro
        case active
        case completed
    }

    public init(onComplete: @escaping (VoiceTestResult) -> Void) {
        self.onComplete = onComplete
    }

    private var currentTwister: TongueTwister {
        AssessmentConstants.tongueTwisters[selectedTwisterIndex]
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
                phase = .active
            }

            VStack(spacing: 8) {
                Text("Voice Articulation")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("Read the phrase aloud while recording to test your speech clarity")
                    .font(.system(size: 16))
                    .foregroundColor(Color.gray)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            ZStack {
                RoundedRectangle(cornerRadius: 36)
                    .fill(LinearGradient(colors: [Color.blue.opacity(0.3), Color.teal.opacity(0.2)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 210, height: 210)
                    .overlay(
                        RoundedRectangle(cornerRadius: 36)
                            .stroke(Color.blue.opacity(0.8), lineWidth: 2)
                    )
                    .shadow(color: Color.blue.opacity(0.4), radius: 25)

                Image(systemName: "mic.fill")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 90, height: 90)
                    .foregroundColor(.blue)
            }

            Spacer()

            Button(action: { phase = .active }) {
                HStack(spacing: 8) {
                    Text("Start Voice Test Now")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 18, weight: .bold))
                }
                .foregroundColor(Color(red: 0.05, green: 0.1, blue: 0.15))
                .frame(maxWidth: .infinity)
                .frame(height: 68)
                .background(Color.blue)
                .cornerRadius(34)
                .shadow(color: Color.blue.opacity(0.6), radius: 18, x: 0, y: 6)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
        }
    }

    private var activeView: View {
        VStack(spacing: 20) {
            VStack(spacing: 4) {
                Text("Voice Test")
                    .font(.system(size: 32, weight: .extrabold))
                    .foregroundColor(.white)
                Text("Read the phrase aloud and record your voice")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }

            // Phrase Card
            ZStack(alignment: .topTrailing) {
                RoundedRectangle(cornerRadius: 28)
                    .fill(Color.black.opacity(0.8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 28)
                            .stroke(Color.white.opacity(0.8), lineWidth: 2)
                    )
                    .frame(minHeight: 180)

                VStack(spacing: 12) {
                    Text(currentTwister.emoji)
                        .font(.system(size: 36))
                    Text("\"\(currentTwister.phrase)\"")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding()

                Button(action: pickNewTwister) {
                    Image(systemName: "shuffle")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.blue)
                        .padding(10)
                        .background(Circle().fill(Color.white.opacity(0.1)))
                }
                .padding(12)
            }
            .padding(.horizontal, 20)

            // Transcript view if speech captured
            if !speechService.transcribedText.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Transcribed Speech:")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text("\"\(speechService.transcribedText)\"")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
                        .italic()
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.06))
                .cornerRadius(16)
                .padding(.horizontal, 20)
            }

            Spacer()

            // Control Buttons Row
            HStack(spacing: 16) {
                Button(action: toggleRecording) {
                    VStack(spacing: 8) {
                        Image(systemName: isListening ? "stop.circle.fill" : "mic.circle.fill")
                            .font(.system(size: 32))
                        Text(isListening ? "Stop Recording" : "Start Recording")
                            .font(.system(size: 16, weight: .bold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 100)
                    .background(isListening ? Color.red : Color.blue)
                    .cornerRadius(24)
                    .shadow(color: (isListening ? Color.red : Color.blue).opacity(0.5), radius: 15)
                }

                Button(action: submitTest) {
                    VStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 32))
                        Text("Submit Test")
                            .font(.system(size: 16, weight: .bold))
                    }
                    .foregroundColor(Color(red: 0.05, green: 0.1, blue: 0.15))
                    .frame(maxWidth: .infinity)
                    .frame(height: 100)
                    .background(Color.emerald)
                    .cornerRadius(24)
                    .shadow(color: Color.emerald.opacity(0.5), radius: 15)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
    }

    private var completedView: View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(.blue)
            Text("Voice Analysis Complete!")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
    }

    private func pickNewTwister() {
        var nextIdx = Int.random(in: 0..<AssessmentConstants.tongueTwisters.count)
        if nextIdx == selectedTwisterIndex {
            nextIdx = (selectedTwisterIndex + 1) % AssessmentConstants.tongueTwisters.count
        }
        selectedTwisterIndex = nextIdx
    }

    private func toggleRecording() {
        if isListening {
            speechService.stopListening()
            isListening = false
        } else {
            Task {
                let granted = await speechService.requestPermissions()
                if granted {
                    recordingStartTime = Date()
                    speechService.startListening()
                    isListening = true
                }
            }
        }
    }

    private func submitTest() {
        if isListening {
            speechService.stopListening()
            isListening = false
        }
        phase = .completed

        let duration = Date().timeIntervalSince(recordingStartTime)
        let capturedText = speechService.transcribedText.isEmpty ? currentTwister.phrase : speechService.transcribedText

        let targetWords = currentTwister.phrase.lowercased().components(separatedBy: .whitespacesAndNewlines)
        let spokenWords = capturedText.lowercased().components(separatedBy: .whitespacesAndNewlines)

        var matches = 0
        for word in targetWords {
            if spokenWords.contains(word) { matches += 1 }
        }
        let acc = Double(matches) / Double(targetWords.count) * 100.0

        let result = VoiceTestResult(
            completed: true,
            duration: duration,
            accuracy: min(100.0, acc),
            userSpeech: capturedText,
            slurringDetected: acc < 70.0,
            slurScore: acc,
            articulationClarity: acc
        )

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            onComplete(result)
        }
    }
}
