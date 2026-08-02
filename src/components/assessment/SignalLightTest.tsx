import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { Volume2, CheckCircle2, XCircle, Play } from 'lucide-react';
import { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, SIGNAL_LIGHT_ROUNDS } from '@/lib/constants';
import type { SignalLightResult } from '@/types/assessment';

interface SignalLightTestProps {
  onComplete: (result: SignalLightResult) => void;
}

type SignalColor = 'red' | 'yellow' | 'green';

interface RoundDetail {
  command: SignalColor;
  selected: SignalColor | null;
  correct: boolean;
  reactionTimeMs: number;
}

const SIGNAL_CONFIG: Record<
  SignalColor,
  {
    label: string;
    voicePhrase: string;
    displayText: string;
    subtitle: string;
    activeColor: string;
    glowColor: string;
    borderColor: string;
    bgGradient: string;
    textStyle: string;
  }
> = {
  red: {
    label: 'Red Signal Light',
    voicePhrase: 'Red Light',
    displayText: 'RED',
    subtitle: 'Click the STOP signal light circle',
    activeColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    borderColor: 'border-rose-500',
    bgGradient: 'from-rose-500/20 to-red-600/30',
    textStyle: 'text-rose-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]',
  },
  yellow: {
    label: 'Yellow Signal Light',
    voicePhrase: 'Yellow Light',
    displayText: 'YELLOW',
    subtitle: 'Click the CAUTION signal light circle',
    activeColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    borderColor: 'border-amber-500',
    bgGradient: 'from-amber-500/20 to-yellow-600/30',
    textStyle: 'text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]',
  },
  green: {
    label: 'Green Signal Light',
    voicePhrase: 'Green Light',
    displayText: 'GREEN',
    subtitle: 'Click the GO signal light circle',
    activeColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    borderColor: 'border-emerald-500',
    bgGradient: 'from-emerald-500/20 to-green-600/30',
    textStyle: 'text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.8)]',
  },
};

const COLORS_ORDER: SignalColor[] = ['red', 'yellow', 'green'];

export function SignalLightTest({ onComplete }: SignalLightTestProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'roundFeedback' | 'completed'>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [targetColor, setTargetColor] = useState<SignalColor>('red');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [canTap, setCanTap] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; reactionMs: number; selected: SignalColor } | null>(null);
  const [roundsHistory, setRoundsHistory] = useState<RoundDetail[]>([]);

  const roundStartTimeRef = useRef<number>(0);
  const previousColorRef = useRef<SignalColor | null>(null);

  // Play voice prompt using ElevenLabs TTS with Web Speech fallback
  const speakCommand = useCallback(async (color: SignalColor) => {
    setIsPlayingAudio(true);
    setCanTap(false);

    const config = SIGNAL_CONFIG[color];

    try {
      if (ELEVENLABS_API_KEY) {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text: config.voicePhrase,
              model_id: 'eleven_turbo_v2_5',
              voice_settings: {
                stability: 0.8,
                similarity_boost: 0.85,
              },
            }),
          }
        );

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          audio.onended = () => {
            setIsPlayingAudio(false);
            setCanTap(true);
            roundStartTimeRef.current = performance.now();
          };
          audio.onerror = () => {
            fallbackSpeech(config.voicePhrase);
          };
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn('ElevenLabs API failed in Signal Light Test, falling back to browser TTS:', e);
    }

    fallbackSpeech(config.voicePhrase);
  }, []);

  const fallbackSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => {
        setIsPlayingAudio(false);
        setCanTap(true);
        roundStartTimeRef.current = performance.now();
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setCanTap(true);
        roundStartTimeRef.current = performance.now();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
      setCanTap(true);
      roundStartTimeRef.current = performance.now();
    }
  };

  // Start next round
  const startRound = useCallback(
    (roundIndex: number) => {
      // Choose color (avoid repeating same color consecutively if possible)
      let available = COLORS_ORDER.filter((c) => c !== previousColorRef.current);
      if (available.length === 0) available = COLORS_ORDER;
      const nextColor = available[Math.floor(Math.random() * available.length)];

      previousColorRef.current = nextColor;
      setTargetColor(nextColor);
      setCurrentRound(roundIndex);
      setLastFeedback(null);
      setPhase('playing');

      // Slight delay before speaking so transition settles
      setTimeout(() => {
        speakCommand(nextColor);
      }, 400);
    },
    [speakCommand]
  );

  const handleStartTest = () => {
    setRoundsHistory([]);
    startRound(0);
  };

  const handleCircleTap = (selectedColor: SignalColor) => {
    if (!canTap || phase !== 'playing') return;

    const reactionTimeMs = Math.round(performance.now() - roundStartTimeRef.current);
    const isCorrect = selectedColor === targetColor;

    setCanTap(false);

    const roundData: RoundDetail = {
      command: targetColor,
      selected: selectedColor,
      correct: isCorrect,
      reactionTimeMs,
    };

    const newHistory = [...roundsHistory, roundData];
    setRoundsHistory(newHistory);

    setLastFeedback({
      correct: isCorrect,
      reactionMs: reactionTimeMs,
      selected: selectedColor,
    });
    setPhase('roundFeedback');

    const nextRoundIndex = currentRound + 1;

    setTimeout(() => {
      if (nextRoundIndex < SIGNAL_LIGHT_ROUNDS) {
        startRound(nextRoundIndex);
      } else {
        // Test complete!
        setPhase('completed');
        finishTest(newHistory);
      }
    }, 1200);
  };

  const finishTest = (history: RoundDetail[]) => {
    const correctCount = history.filter((r) => r.correct).length;
    const accuracy = Math.round((correctCount / SIGNAL_LIGHT_ROUNDS) * 100);
    const correctRounds = history.filter((r) => r.correct);
    const avgReactionTime =
      correctRounds.length > 0
        ? Math.round(correctRounds.reduce((sum, r) => sum + r.reactionTimeMs, 0) / correctRounds.length)
        : 2000;
    const wrongTaps = history.filter((r) => !r.correct).length;

    setTimeout(() => {
      onComplete({
        accuracy,
        avgReactionTime,
        rounds: history,
        wrongTaps,
      });
    }, 1000);
  };

  // Render Intro Phase
  if (phase === 'intro') {
    return (
      <PageTransition>
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center px-4 py-6 max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2 flex flex-col items-center justify-center pt-2">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Phase 5: Signal Light Test
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Signal & Audio Reaction Test
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed pt-1">
              Listen to the voice command announcing the signal light color, then tap the matching colored circle as fast as you can.
            </p>
          </div>

          {/* Traffic Light Visual Card */}
          <div className="w-full max-w-sm glass-card p-6 rounded-3xl border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center space-y-5">
            <div className="flex items-center justify-center gap-4 py-3 px-6 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner">
              <div className="w-9 h-9 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] border border-rose-400/50 flex items-center justify-center font-bold text-white text-xs">
                STOP
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] border border-amber-400/50 flex items-center justify-center font-bold text-white text-xs">
                SLOW
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] border border-emerald-400/50 flex items-center justify-center font-bold text-white text-xs">
                GO
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1.5 text-center px-2">
              <p>• {SIGNAL_LIGHT_ROUNDS} Quick Rounds</p>
              <p>• Voice command speaks signal color</p>
              <p>• Tests auditory-motor reaction speed</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 35px rgba(20, 184, 166, 0.5)' }}
              whileTap={{ scale: 0.96 }}
              onClick={handleStartTest}
              className="w-full py-6 sm:py-7 rounded-3xl bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-500 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 cursor-pointer shadow-2xl transition-all border border-teal-400/40"
            >
              <Play className="w-7 h-7 fill-current" />
              <span>Begin Signal Light Test</span>
            </motion.button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Render Completed Phase
  if (phase === 'completed') {
    return (
      <PageTransition>
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center px-4 py-8 max-w-md mx-auto space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Test Completed!</h2>
            <p className="text-sm text-slate-400 mt-1">Calculating final sobriety score...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  const currentConfig = SIGNAL_CONFIG[targetColor];

  return (
    <PageTransition>
      <div className="w-full flex-1 flex flex-col justify-between items-center text-center px-4 py-4 max-w-md sm:max-w-lg mx-auto space-y-4">
        {/* Top Header & Progress */}
        <div className="w-full flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-teal-400 border border-slate-700">
              Round {currentRound + 1} of {SIGNAL_LIGHT_ROUNDS}
            </span>
          </div>

          <button
            onClick={() => speakCommand(targetColor)}
            disabled={isPlayingAudio}
            className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-teal-400' : ''}`} />
            <span>Replay Voice</span>
          </button>
        </div>

        {/* Display Text Cue (STOP / CAUTION / GO) */}
        <div className="w-full flex flex-col items-center justify-center py-2 space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRound + targetColor}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center"
            >
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                {isPlayingAudio ? '🔊 Listening to Voice...' : 'NOW CLICK THE SIGNAL'}
              </span>
              <h1 className={`text-5xl sm:text-6xl font-black tracking-wider ${currentConfig.textStyle}`}>
                {currentConfig.displayText}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-2">
                {currentConfig.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3 Signal Light Circles (Red, Yellow, Green) */}
        <div className="w-full glass-card p-6 rounded-3xl border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center justify-center gap-4 sm:gap-6 w-full py-4">
            {COLORS_ORDER.map((color) => {
              const cfg = SIGNAL_CONFIG[color];
              const isTarget = color === targetColor;
              const isSelected = lastFeedback?.selected === color;

              return (
                <motion.button
                  key={color}
                  whileHover={canTap ? { scale: 1.08 } : {}}
                  whileTap={canTap ? { scale: 0.92 } : {}}
                  onClick={() => handleCircleTap(color)}
                  disabled={!canTap}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-2xl ${canTap
                      ? 'opacity-100 hover:brightness-110'
                      : 'opacity-90 cursor-not-allowed'
                    } ${cfg.borderColor}`}
                  style={{
                    backgroundColor: color === 'red' ? '#DC2626' : color === 'yellow' ? '#D97706' : '#059669',
                    boxShadow: isTarget && canTap ? `0 0 35px ${cfg.glowColor}` : '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Outer Glow Ring for active target */}
                  {isTarget && canTap && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-white pointer-events-none" />
                  )}

                  {/* Label inside circle */}
                  <span className="text-white font-extrabold text-sm sm:text-base tracking-wider uppercase drop-shadow-md">
                    {color === 'red' ? 'STOP' : color === 'yellow' ? 'CAUTION' : 'GO'}
                  </span>

                  {/* Feedback Overlay inside clicked button */}
                  {isSelected && lastFeedback && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 rounded-full bg-slate-950/80 flex items-center justify-center"
                    >
                      {lastFeedback.correct ? (
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      ) : (
                        <XCircle className="w-10 h-10 text-rose-500" />
                      )}
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Round Feedback Message */}
          <div className="h-10 flex items-center justify-center w-full">
            {lastFeedback ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-extrabold ${lastFeedback.correct
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
              >
                {lastFeedback.correct ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Correct Signal! ({lastFeedback.reactionMs} ms)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Wrong Signal Selected!</span>
                  </>
                )}
              </motion.div>
            ) : isPlayingAudio ? (
              <span className="text-xs text-teal-400 font-semibold flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 animate-pulse" />
                Listening to Voice Command...
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">
                Tap the matching signal light circle!
              </span>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
