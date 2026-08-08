import Foundation

public struct DrawingTestResult: Codable, Equatable, Sendable {
    public var accuracy: Double
    public var completionTime: Double
    public var avgDeviationPx: Double
    public var offPathCount: Int
    public var passed: Bool

    public init(accuracy: Double, completionTime: Double, avgDeviationPx: Double, offPathCount: Int, passed: Bool) {
        self.accuracy = accuracy
        self.completionTime = completionTime
        self.avgDeviationPx = avgDeviationPx
        self.offPathCount = offPathCount
        self.passed = passed
    }
}

public typealias EyeContactTestResult = DrawingTestResult

public struct BalanceTestResult: Codable, Equatable, Sendable {
    public var stabilityScore: Double // 0 to 100
    public var completionTime: Double // 15s
    public var avgTiltDegrees: Double
    public var maxTiltDegrees: Double
    public var wobbleCount: Int
    public var passed: Bool

    public init(stabilityScore: Double, completionTime: Double, avgTiltDegrees: Double, maxTiltDegrees: Double, wobbleCount: Int, passed: Bool) {
        self.stabilityScore = stabilityScore
        self.completionTime = completionTime
        self.avgTiltDegrees = avgTiltDegrees
        self.maxTiltDegrees = maxTiltDegrees
        self.wobbleCount = wobbleCount
        self.passed = passed
    }
}

public struct MemoryRound: Codable, Equatable, Sendable {
    public var correct: Int
    public var total: Int
    public var time: Double

    public init(correct: Int, total: Int, time: Double) {
        self.correct = correct
        self.total = total
        self.time = time
    }
}

public struct EmojiMemoryResult: Codable, Equatable, Sendable {
    public var accuracy: Double
    public var timeTaken: Double
    public var mistakes: Int
    public var rounds: [MemoryRound]

    public init(accuracy: Double, timeTaken: Double, mistakes: Int, rounds: [MemoryRound]) {
        self.accuracy = accuracy
        self.timeTaken = timeTaken
        self.mistakes = mistakes
        self.rounds = rounds
    }
}

public struct GridMemoryResult: Codable, Equatable, Sendable {
    public var accuracy: Double
    public var completionTime: Double
    public var mistakes: Int
    public var rounds: [MemoryRound]

    public init(accuracy: Double, completionTime: Double, mistakes: Int, rounds: [MemoryRound]) {
        self.accuracy = accuracy
        self.completionTime = completionTime
        self.mistakes = mistakes
        self.rounds = rounds
    }
}

public struct VoiceTestResult: Codable, Equatable, Sendable {
    public var completed: Bool
    public var duration: Double
    public var accuracy: Double
    public var userSpeech: String?
    public var slurringDetected: Bool?
    public var slurScore: Double?
    public var articulationClarity: Double?

    public init(completed: Bool, duration: Double, accuracy: Double, userSpeech: String? = nil, slurringDetected: Bool? = nil, slurScore: Double? = nil, articulationClarity: Double? = nil) {
        self.completed = completed
        self.duration = duration
        self.accuracy = accuracy
        self.userSpeech = userSpeech
        self.slurringDetected = slurringDetected
        self.slurScore = slurScore
        self.articulationClarity = articulationClarity
    }
}

public enum LightCommand: String, Codable, Equatable, Sendable {
    case green
    case yellow
    case red
}

public struct SignalLightRound: Codable, Equatable, Sendable {
    public var command: LightCommand
    public var selected: LightCommand?
    public var correct: Bool
    public var reactionTimeMs: Double

    public init(command: LightCommand, selected: LightCommand?, correct: Bool, reactionTimeMs: Double) {
        self.command = command
        self.selected = selected
        self.correct = correct
        self.reactionTimeMs = reactionTimeMs
    }
}

public struct SignalLightResult: Codable, Equatable, Sendable {
    public var accuracy: Double
    public var avgReactionTime: Double
    public var rounds: [SignalLightRound]
    public var wrongTaps: Int

    public init(accuracy: Double, avgReactionTime: Double, rounds: [SignalLightRound], wrongTaps: Int) {
        self.accuracy = accuracy
        self.avgReactionTime = avgReactionTime
        self.rounds = rounds
        self.wrongTaps = wrongTaps
    }
}

public struct TestScores: Codable, Equatable, Sendable {
    public var drawing: Double
    public var balance: Double
    public var eyeContact: Double?
    public var emojiMemory: Double
    public var gridMemory: Double
    public var voice: Double
    public var signalLight: Double

    public init(drawing: Double, balance: Double, eyeContact: Double? = nil, emojiMemory: Double, gridMemory: Double, voice: Double, signalLight: Double) {
        self.drawing = drawing
        self.balance = balance
        self.eyeContact = eyeContact
        self.emojiMemory = emojiMemory
        self.gridMemory = gridMemory
        self.voice = voice
        self.signalLight = signalLight
    }
}

public enum SobrietyVerdict: String, Codable, Equatable, Sendable {
    case sober
    case mildlyImpaired
    case severelyImpaired

    public var title: String {
        switch self {
        case .sober:
            return "Clear & Fit to Drive"
        case .mildlyImpaired:
            return "Mild Impairment Detected"
        case .severelyImpaired:
            return "Significant Impairment Detected"
        }
    }
}

public struct AssessmentResult: Codable, Equatable, Sendable {
    public var verdict: SobrietyVerdict
    public var confidence: Double
    public var weightedScore: Double
    public var summary: String
    public var testScores: TestScores

    public init(verdict: SobrietyVerdict, confidence: Double, weightedScore: Double, summary: String, testScores: TestScores) {
        self.verdict = verdict
        self.confidence = confidence
        self.weightedScore = weightedScore
        self.summary = summary
        self.testScores = testScores
    }
}

public enum TestStep: Int, CaseIterable, Identifiable, Sendable {
    case drawing = 0
    case balance = 1
    case emoji = 2
    case grid = 3
    case voice = 4
    case signalLight = 5

    public var id: Int { rawValue }

    public var title: String {
        switch self {
        case .drawing: return "Object Tracking"
        case .balance: return "Palm Balance Test"
        case .emoji: return "Emoji Memory"
        case .grid: return "Grid Pattern Memory"
        case .voice: return "Speech & Voice"
        case .signalLight: return "Signal Light Reaction"
        }
    }

    public var subtitle: String {
        switch self {
        case .drawing: return "Fine Motor Precision"
        case .balance: return "15s Motion & Tilt Stability"
        case .emoji: return "Sequence Recall"
        case .grid: return "Spatial Pattern Recall"
        case .voice: return "Articulation & Slurring"
        case .signalLight: return "Cognitive Reaction Speed"
        }
    }
}

public struct AssessmentState: Equatable, Sendable {
    public var currentStep: Int = 0
    public var drawingResult: DrawingTestResult? = nil
    public var balanceResult: BalanceTestResult? = nil
    public var eyeContactResult: EyeContactTestResult? = nil
    public var emojiResult: EmojiMemoryResult? = nil
    public var gridResult: GridMemoryResult? = nil
    public var voiceResult: VoiceTestResult? = nil
    public var signalLightResult: SignalLightResult? = nil
    public var finalResult: AssessmentResult? = nil

    public init() {}
}
