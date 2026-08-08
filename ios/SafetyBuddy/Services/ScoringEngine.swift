import Foundation

public final class ScoringEngine: Sendable {
    public static func clamp(_ value: Double, min minVal: Double, max maxVal: Double) -> Double {
        return Swift.max(minVal, Swift.min(maxVal, value))
    }

    public static func scoreDrawingTest(_ result: DrawingTestResult) -> Double {
        return clamp(round(result.accuracy), min: 0, max: 100)
    }

    public static func scoreBalanceTest(_ result: BalanceTestResult) -> Double {
        return clamp(round(result.stabilityScore), min: 0, max: 100)
    }

    public static func scoreEmojiMemory(_ result: EmojiMemoryResult) -> Double {
        return clamp(round(result.accuracy), min: 0, max: 100)
    }

    public static func scoreGridMemory(_ result: GridMemoryResult) -> Double {
        return clamp(round(result.accuracy), min: 0, max: 100)
    }

    public static func scoreVoice(_ result: VoiceTestResult) -> Double {
        var baseScore: Double = result.accuracy
        if let slur = result.slurScore {
            baseScore = baseScore * 0.6 + slur * 0.4
        } else if result.slurringDetected == true {
            baseScore = Swift.max(0, baseScore - 30)
        }
        return clamp(round(baseScore), min: 0, max: 100)
    }

    public static func scoreSignalLight(_ result: SignalLightResult) -> Double {
        let accuracyScore = result.accuracy
        var reactionScore: Double = 100.0
        if result.avgReactionTime > 400 {
            let penalty = ((result.avgReactionTime - 400.0) / 1600.0) * 100.0
            reactionScore = Swift.max(0, 100.0 - penalty)
        }
        let combined = accuracyScore * 0.7 + reactionScore * 0.3
        return clamp(round(combined), min: 0, max: 100)
    }

    public static func getVerdict(for score: Double) -> SobrietyVerdict {
        if score >= AssessmentConstants.verdictSoberThreshold {
            return .sober
        } else if score >= AssessmentConstants.verdictMildThreshold {
            return .mildlyImpaired
        } else {
            return .severelyImpaired
        }
    }

    public static func generateSummary(scores: TestScores, verdict: SobrietyVerdict) -> String {
        var issues: [String] = []

        if scores.drawing < 80 { issues.append("Reduced fine motor tracing precision or off-path straying detected") }
        if scores.balance < 80 { issues.append("Device tilt wobble or instability detected during palm balance test") }
        if scores.emojiMemory < 80 { issues.append("Your emoji recall accuracy was below normal") }
        if scores.gridMemory < 80 { issues.append("Your visual pattern memory showed reduced accuracy") }
        if scores.voice < 80 { issues.append("Voice repetition showed articulation slurring or match inaccuracies") }
        if scores.signalLight < 80 { issues.append("Signal light voice command reaction was delayed or incorrect") }

        switch verdict {
        case .sober:
            return "Your motor precision, palm balance stability, memory recall, voice articulation, and signal light reaction passed with flying colors across all tests (80%+). No meaningful impairment was detected. Drive safely!"
        case .mildlyImpaired:
            let issueText = !issues.isEmpty ? issues.joined(separator: "; ") + "." : "Some tests fell below the 80% passing threshold."
            return "\(issueText) While these changes may be caused by fatigue or other factors, consider taking a break or choosing an alternative ride."
        case .severelyImpaired:
            let issueText = !issues.isEmpty ? issues.joined(separator: "; ") + "." : "Multiple tests showed significant deviations below 80%."
            return "\(issueText) For your safety and the safety of others, we strongly recommend choosing a safe ride home."
        }
    }

    public static func calculateConfidence(scores: TestScores, verdict: SobrietyVerdict) -> Double {
        let values: [Double] = [scores.drawing, scores.balance, scores.emojiMemory, scores.gridMemory, scores.voice, scores.signalLight]
        let avg = values.reduce(0.0, +) / Double(values.count)
        let variance = values.reduce(0.0) { $0 + pow($1 - avg, 2) } / Double(values.count)
        let stdDev = sqrt(variance)

        var confidence = 95.0 - stdDev * 0.5

        if verdict == .sober && avg > 90 { confidence = Swift.min(99.0, confidence + 5.0) }
        if verdict == .severelyImpaired && avg < 30 { confidence = Swift.min(98.0, confidence + 8.0) }

        return clamp(round(confidence), min: 50, max: 99)
    }

    public static func calculateAssessment(
        drawing: DrawingTestResult,
        balance: BalanceTestResult,
        emoji: EmojiMemoryResult,
        grid: GridMemoryResult,
        voice: VoiceTestResult,
        signalLight: SignalLightResult
    ) -> AssessmentResult {
        let testScores = TestScores(
            drawing: scoreDrawingTest(drawing),
            balance: scoreBalanceTest(balance),
            emojiMemory: scoreEmojiMemory(emoji),
            gridMemory: scoreGridMemory(grid),
            voice: scoreVoice(voice),
            signalLight: scoreSignalLight(signalLight)
        )

        let weightedScore = round(
            testScores.drawing * AssessmentConstants.weightDrawing +
            testScores.balance * AssessmentConstants.weightBalance +
            testScores.emojiMemory * AssessmentConstants.weightEmoji +
            testScores.gridMemory * AssessmentConstants.weightGrid +
            testScores.voice * AssessmentConstants.weightVoice +
            testScores.signalLight * AssessmentConstants.weightSignalLight
        )

        let verdict = getVerdict(for: weightedScore)
        let confidence = calculateConfidence(scores: testScores, verdict: verdict)
        let summary = generateSummary(scores: testScores, verdict: verdict)

        return AssessmentResult(
            verdict: verdict,
            confidence: confidence,
            weightedScore: weightedScore,
            summary: summary,
            testScores: testScores
        )
    }
}
