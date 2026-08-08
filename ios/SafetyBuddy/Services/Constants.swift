import Foundation

public struct TongueTwister: Identifiable, Sendable {
    public let id: Int
    public let title: String
    public let emoji: String
    public let phrase: String

    public init(id: Int, title: String, emoji: String, phrase: String) {
        self.id = id
        self.title = title
        self.emoji = emoji
        self.phrase = phrase
    }
}

public struct AssessmentConstants {
    public static let autoStartDurationSec: Double = 7.0
    public static let balanceDurationSec: Double = 15.0

    public static let emojiPool: [String] = [
        "🍕", "🐱", "⭐", "🐶", "🚀", "🍎", "🚗", "🎧",
        "🔥", "🏀", "🎨", "🎁", "👑", "💎", "🍔", "🍦",
        "🎈", "🚲", "🍋", "🍇", "🐼", "🦊", "⛵", "🍒"
    ]

    public static let reactionRounds: Int = 5
    public static let emojiRounds: Int = 2
    public static let emojiCount: Int = 4
    public static let emojiDisplayTimeMs: Double = 4000
    public static let gridRounds: Int = 2
    public static let gridSize: Int = 4
    public static let gridHighlightCount: Int = 4
    public static let gridDisplayTimeMs: Double = 3000
    public static let recallTimeLimitSec: Double = 10
    public static let signalLightRounds: Int = 3

    // Adjusted Weights (Total 100%):
    // drawing: 18%, balance: 15%, emoji: 12%, grid: 10%, voice: 18%, signal light: 27%
    public static let weightDrawing: Double = 0.18
    public static let weightBalance: Double = 0.15
    public static let weightEmoji: Double = 0.12
    public static let weightGrid: Double = 0.10
    public static let weightVoice: Double = 0.18
    public static let weightSignalLight: Double = 0.27

    public static let verdictSoberThreshold: Double = 80.0
    public static let verdictMildThreshold: Double = 50.0

    public static let tongueTwisters: [TongueTwister] = [
        TongueTwister(id: 1, title: "The Silly Sailor", emoji: "⛵", phrase: "Seven swift sailors sliced salty sausages on shiny silver saucers."),
        TongueTwister(id: 2, title: "The Busy Baker", emoji: "🧁", phrase: "Big Bobby baked bright blueberry biscuits before Blake bought brown butter."),
        TongueTwister(id: 3, title: "The Precise Parrot", emoji: "🦜", phrase: "Polly's plush purple parrot picked a pair of pristine pink plums."),
        TongueTwister(id: 4, title: "The Crispy Crab", emoji: "🦀", phrase: "Crunchy crabs clumsily crawled across Clear Creek's cold cobblestones."),
        TongueTwister(id: 5, title: "The Fierce Fox", emoji: "🦊", phrase: "Five frantic foxes flipped fifteen fresh pancakes on Friday afternoon.")
    ]
}
