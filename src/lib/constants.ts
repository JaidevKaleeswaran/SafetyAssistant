// Emoji pools for memory test (100% Universal Mobile Codepoints)
export const EMOJI_POOL = [
  '🍕', '🐱', '⭐', '🐶', '🚀', '🍎', '🚗', '🎧',
  '🔥', '🏀', '🎨', '🎁', '👑', '💎', '🍔', '🍦',
  '🎈', '🚲', '🍋', '🍇', '🐼', '🦊', '⛵', '🍒',
];

// Reaction time thresholds (milliseconds)
export const REACTION_THRESHOLDS = {
  excellent: 350,
  good: 500,
  concerning: 700,
  poor: 1000,
} as const;

// Number of rounds per test
export const REACTION_ROUNDS = 5;
export const EMOJI_ROUNDS = 3;
export const EMOJI_COUNT = 4;
export const EMOJI_DISPLAY_TIME = 4000; // ms
export const GRID_ROUNDS = 3;
export const GRID_SIZE = 4;
export const GRID_HIGHLIGHT_COUNT = 4;
export const GRID_DISPLAY_TIME = 5000; // ms

// Eye Contact test constants
export const EYE_CONTACT_DURATION = 15; // seconds
export const EYE_CONTACT_PASS_PERCENTAGE = 80; // % eye contact required to pass

// Signal Light test constants
export const SIGNAL_LIGHT_ROUNDS = 5;

// Scoring weights: Drawing & Emoji 25% each, Grid & Voice 15% each, Signal Light 20%
export const SCORE_WEIGHTS = {
  drawing: 0.25,
  emojiMemory: 0.25,
  gridMemory: 0.15,
  voice: 0.15,
  signalLight: 0.20,
} as const;

// Verdict thresholds (80%+ is passing score)
export const VERDICT_THRESHOLDS = {
  sober: 80,
  mildlyImpaired: 50,
  // below 50 = severely impaired
} as const;

// Reaction time delays (random range in ms)
export const REACTION_MIN_DELAY = 2000;
export const REACTION_MAX_DELAY = 5000;

// ElevenLabs agent & API config
export const ELEVENLABS_AGENT_ID = 'agent_6001kz1q7wy0fahsr1zprscy2cqa';
export const ELEVENLABS_API_KEY = 'sk_927e1f68da56c2645f9d83229b5843aa2a172a19b7b9338e';
export const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (clear English voice)

// Gemini AI Vision config
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
