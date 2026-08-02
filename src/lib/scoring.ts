import type {
  DrawingTestResult,
  EmojiMemoryResult,
  GridMemoryResult,
  VoiceTestResult,
  SignalLightResult,
  AssessmentResult,
  SobrietyVerdict,
  TestScores,
} from '@/types/assessment';
import { SCORE_WEIGHTS, VERDICT_THRESHOLDS } from './constants';
import { clamp } from './utils';

/** Score the Shape Tracing Drawing Test (0–100) */
export function scoreDrawingTest(result: DrawingTestResult): number {
  return clamp(Math.round(result.accuracy), 0, 100);
}

/** Legacy alias for scoreDrawingTest */
export const scoreEyeContact = scoreDrawingTest;

/** Score the emoji memory test (0–100) */
export function scoreEmojiMemory(result: EmojiMemoryResult): number {
  return clamp(Math.round(result.accuracy), 0, 100);
}

/** Score the grid memory test (0–100) */
export function scoreGridMemory(result: GridMemoryResult): number {
  return clamp(Math.round(result.accuracy), 0, 100);
}

/** Score the voice test with speech accuracy and slurring penalty (0–100) */
export function scoreVoice(result: VoiceTestResult): number {
  let baseScore = 0;
  if (typeof result.accuracy === 'number') {
    baseScore = result.accuracy;
  } else {
    baseScore = result.completed ? 100 : 0;
  }

  // If slurring score is explicitly available, factor it in
  if (typeof result.slurScore === 'number') {
    baseScore = baseScore * 0.6 + result.slurScore * 0.4;
  } else if (result.slurringDetected) {
    baseScore = Math.max(0, baseScore - 30);
  }

  return clamp(Math.round(baseScore), 0, 100);
}

/** Score the Signal Light Test (0–100): 70% accuracy + 30% reaction speed */
export function scoreSignalLight(result: SignalLightResult): number {
  const accuracyScore = result.accuracy; // 0-100%

  let reactionScore = 100;
  if (result.avgReactionTime > 400) {
    const penalty = ((result.avgReactionTime - 400) / 1600) * 100;
    reactionScore = Math.max(0, 100 - penalty);
  }

  const combined = accuracyScore * 0.7 + reactionScore * 0.3;
  return clamp(Math.round(combined), 0, 100);
}

/** Determine verdict from weighted score (80%+ is passing) */
function getVerdict(score: number): SobrietyVerdict {
  if (score >= VERDICT_THRESHOLDS.sober) return 'sober';
  if (score >= VERDICT_THRESHOLDS.mildlyImpaired) return 'mildlyImpaired';
  return 'severelyImpaired';
}

/** Generate a human-readable summary based on test scores */
function generateSummary(scores: TestScores, verdict: SobrietyVerdict): string {
  const issues: string[] = [];

  if (scores.drawing < 80) issues.push('Reduced fine motor tracing precision or off-path straying detected');
  if (scores.emojiMemory < 80) issues.push('Your emoji recall accuracy was below normal');
  if (scores.gridMemory < 80) issues.push('Your visual pattern memory showed reduced accuracy');
  if (scores.voice < 80) issues.push('Voice repetition showed articulation slurring or match inaccuracies');
  if (scores.signalLight < 80) issues.push('Signal light voice command reaction was delayed or incorrect');

  if (verdict === 'sober') {
    return 'Your fine motor control, memory recall, voice articulation, and signal light reaction passed with flying colors across all tests (80%+). No meaningful impairment was detected. Drive safely!';
  }

  if (verdict === 'mildlyImpaired') {
    const issueText = issues.length > 0 ? issues.join('; ') + '.' : 'Some tests fell below the 80% passing threshold.';
    return `${issueText} While these changes may be caused by fatigue or other factors, consider taking a break or choosing an alternative ride.`;
  }

  const issueText = issues.length > 0 ? issues.join('; ') + '.' : 'Multiple tests showed significant deviations below 80%.';
  return `${issueText} For your safety and the safety of others, we strongly recommend choosing a safe ride home.`;
}

/** Calculate confidence based on how consistent the test results are */
function calculateConfidence(scores: TestScores, verdict: SobrietyVerdict): number {
  const values = Object.values(scores).filter((v) => typeof v === 'number') as number[];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  let confidence = 95 - stdDev * 0.5;

  if (verdict === 'sober' && avg > 90) confidence = Math.min(99, confidence + 5);
  if (verdict === 'severelyImpaired' && avg < 30) confidence = Math.min(98, confidence + 8);

  return clamp(Math.round(confidence), 50, 99);
}

/** Main scoring function — takes all 5 test results and produces final assessment */
export function calculateAssessment(
  drawing: DrawingTestResult,
  emoji: EmojiMemoryResult,
  grid: GridMemoryResult,
  voice: VoiceTestResult,
  signalLight: SignalLightResult
): AssessmentResult {
  const testScores: TestScores = {
    drawing: scoreDrawingTest(drawing),
    emojiMemory: scoreEmojiMemory(emoji),
    gridMemory: scoreGridMemory(grid),
    voice: scoreVoice(voice),
    signalLight: scoreSignalLight(signalLight),
  };

  const weightedScore = Math.round(
    testScores.drawing * SCORE_WEIGHTS.drawing +
    testScores.emojiMemory * SCORE_WEIGHTS.emojiMemory +
    testScores.gridMemory * SCORE_WEIGHTS.gridMemory +
    testScores.voice * SCORE_WEIGHTS.voice +
    testScores.signalLight * SCORE_WEIGHTS.signalLight
  );

  const verdict = getVerdict(weightedScore);
  const confidence = calculateConfidence(testScores, verdict);
  const summary = generateSummary(testScores, verdict);

  return {
    verdict,
    confidence,
    weightedScore,
    summary,
    testScores,
  };
}
