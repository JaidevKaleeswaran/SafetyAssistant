export interface DrawingTestResult {
  accuracy: number;
  completionTime: number;
  avgDeviationPx: number;
  offPathCount: number;
  passed: boolean;
}

export type EyeContactTestResult = DrawingTestResult;

export interface BalanceTestResult {
  stabilityScore: number;
  completionTime: number;
  avgTiltDegrees: number;
  maxTiltDegrees: number;
  wobbleCount: number;
  passed: boolean;
}

export interface EmojiMemoryResult {
  accuracy: number;
  timeTaken: number;
  mistakes: number;
  rounds: { correct: number; total: number; time: number }[];
}

export interface GridMemoryResult {
  accuracy: number;
  completionTime: number;
  mistakes: number;
  rounds: { correct: number; total: number; time: number }[];
}

export interface VoiceTestResult {
  completed: boolean;
  duration: number;
  accuracy: number;
  userSpeech?: string;
  slurringDetected?: boolean;
  slurScore?: number; // 0 (heavy slurring) to 100 (clear articulation)
  articulationClarity?: number;
}

export interface SignalLightResult {
  accuracy: number;
  avgReactionTime: number;
  rounds: {
    command: 'green' | 'yellow' | 'red';
    selected: 'green' | 'yellow' | 'red' | null;
    correct: boolean;
    reactionTimeMs: number;
  }[];
  wrongTaps: number;
}

export interface TestScores {
  drawing: number;
  balance: number;
  eyeContact?: number;
  emojiMemory: number;
  gridMemory: number;
  voice: number;
  signalLight: number;
}

export type SobrietyVerdict = 'sober' | 'mildlyImpaired' | 'severelyImpaired';

export interface AssessmentResult {
  verdict: SobrietyVerdict;
  confidence: number;
  weightedScore: number;
  summary: string;
  testScores: TestScores;
}

export type TestStep = 'drawing' | 'balance' | 'emoji' | 'grid' | 'voice' | 'signalLight';

export interface AssessmentState {
  currentStep: number;
  drawingResult: DrawingTestResult | null;
  balanceResult: BalanceTestResult | null;
  eyeContactResult?: EyeContactTestResult | null;
  emojiResult: EmojiMemoryResult | null;
  gridResult: GridMemoryResult | null;
  voiceResult: VoiceTestResult | null;
  signalLightResult: SignalLightResult | null;
  finalResult: AssessmentResult | null;
}

export const TEST_STEPS: TestStep[] = ['drawing', 'balance', 'emoji', 'grid', 'voice', 'signalLight'];
