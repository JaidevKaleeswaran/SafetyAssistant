// Auto start timer & balance duration
export const AUTO_START_DURATION_SEC = 7;
export const BALANCE_DURATION_SEC = 15;

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
export const EMOJI_ROUNDS = 2;
export const EMOJI_COUNT = 4;
export const EMOJI_DISPLAY_TIME = 4000; // ms
export const GRID_ROUNDS = 2;
export const GRID_SIZE = 4;
export const GRID_HIGHLIGHT_COUNT = 4;
export const GRID_DISPLAY_TIME = 3000; // 3 seconds to memorize
export const RECALL_TIME_LIMIT_SEC = 10; // 10 seconds recall timeout per round

// Eye Contact test constants
export const EYE_CONTACT_DURATION = 15; // seconds
export const EYE_CONTACT_PASS_PERCENTAGE = 80; // % eye contact required to pass

// Signal Light test constants
export const SIGNAL_LIGHT_ROUNDS = 3;

// Scoring weights: Total = 100%
export const SCORE_WEIGHTS = {
  drawing: 0.18,
  balance: 0.15,
  emojiMemory: 0.12,
  gridMemory: 0.10,
  voice: 0.18,
  signalLight: 0.27,
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

// 5 Tongue Twisters Pool for Voice & Articulation Test
export const TONGUE_TWISTERS = [
  {
    id: 1,
    title: 'The Silly Sailor',
    emoji: '⛵',
    phrase: 'Seven swift sailors sliced salty sausages on shiny silver saucers.',
  },
  {
    id: 2,
    title: 'The Busy Baker',
    emoji: '🧁',
    phrase: 'Big Bobby baked bright blueberry biscuits before Blake bought brown butter.',
  },
  {
    id: 3,
    title: 'The Precise Parrot',
    emoji: '🦜',
    phrase: 'Polly’s plush purple parrot picked a pair of pristine pink plums.',
  },
  {
    id: 4,
    title: 'The Crispy Crab',
    emoji: '🦀',
    phrase: "Crunchy crabs clumsily crawled across Clear Creek's cold cobblestones.",
  },
  {
    id: 5,
    title: 'The Fierce Fox',
    emoji: '🦊',
    phrase: 'Five frantic foxes flipped fifteen fresh pancakes on Friday afternoon.',
  },
] as const;

// Gemini AI Vision config
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
