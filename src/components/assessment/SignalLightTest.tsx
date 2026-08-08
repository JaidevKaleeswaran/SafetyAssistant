import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { AutoStartTimerBar } from '@/components/shared/AutoStartTimerBar';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';
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
    subtitle: 'Click the SLOW signal light circle',
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
  const roundTimeoutRef = useRef<any>(null);

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
            startTappingPhase();
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

  const startTappingPhase = () => {
    setIsPlayingAudio(false);
    setCanTap(true);
    roundStartTimeRef.current = performance.now();

    if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
    roundTimeoutRef.current = setTimeout(() => {
      handleCircleTap(null);
    }, 10000);
  };

  const fallbackSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => startTappingPhase();
      utterance.onerror = () => startTappingPhase();
      window.speechSynthesis.speak(utterance);
    } else {
      startTappingPhase();
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

  const handleCircleTap = (selectedColor: SignalColor | null) => {
    if (!canTap || phase !== 'playing') return;
    if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);

    const reactionTimeMs = selectedColor
      ? Math.round(performance.now() - roundStartTimeRef.current)
      : 10000;
    const isCorrect = selectedColor === targetColor;

    setCanTap(false);

    const roundData: RoundDetail = {
      command: targetColor,
      selected: selectedColor || ('none' as any),
      correct: isCorrect,
      reactionTimeMs,
    };

    const newHistory = [...roundsHistory, roundData];
    setRoundsHistory(newHistory);

    setLastFeedback({
      correct: isCorrect,
      reactionMs: reactionTimeMs,
      selected: selectedColor || ('none' as any),
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
        <div className="w-full flex-1 flex flex-col items-center justify-between text-center px-6 py-6 sm:py-10 max-w-md sm:max-w-lg mx-auto min-h-[480px] sm:min-h-[520px]">
          {/* 7-Second Auto-Start Progress Bar */}
          <AutoStartTimerBar duration={7} onAutoStart={handleStartTest} />

          {/* Top: Title & Subtitle */}
          <div className="space-y-3 pt-2">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Signal Light Reaction
            </h1>
            <p className="text-base sm:text-lg text-slate-200 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Listen for the spoken light color and tap the matching circle
            </p>
          </div>

          {/* Center Hero Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-[36px] bg-gradient-to-br from-amber-950/80 via-slate-900 to-rose-950/80 border-2 border-amber-400/80 flex flex-col items-center justify-center gap-3.5 shadow-[0_0_60px_rgba(245,158,11,0.35)] relative overflow-hidden my-4"
          >
            <div className="absolute inset-2 rounded-[28px] border border-amber-400/30 pointer-events-none" />
            <div className="w-12 h-12 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.8)] border-2 border-blue-300 flex items-center justify-center font-black text-white text-xs">STOP</div>
            <div className="w-12 h-12 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.8)] border-2 border-blue-300 flex items-center justify-center font-black text-white text-xs">SLOW</div>
            <div className="w-12 h-12 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.8)] border-2 border-blue-300 flex items-center justify-center font-black text-white text-xs">GO</div>
          </motion.div>

          {/* Bottom Pill Button */}
          <motion.button
            whileHover={{ scale: 1.06, boxShadow: '0 0 50px rgba(245,158,11,0.8)' }}
            whileTap={{ scale: 0.94 }}
            onClick={handleStartTest}
            className="w-full sm:w-auto min-w-[280px] sm:min-w-[340px] py-6 sm:py-7 px-16 sm:px-24 min-h-[80px] sm:min-h-[88px] rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-2xl sm:text-3xl cursor-pointer shadow-2xl transition-all border-2 border-amber-200/50"
          >
            Begin Test
          </motion.button>
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

        {/* Center Signal Light Target Display (Blank Red, Yellow, or Green Circle) */}
        <div className="w-full flex flex-col items-center justify-center py-3 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRound + targetColor}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center justify-center space-y-2"
            >
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                TARGET SIGNAL
              </span>
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 shadow-2xl transition-all duration-300 ${
                  targetColor === 'red'
                    ? 'bg-rose-600 border-rose-400 shadow-[0_0_40px_rgba(239,68,68,0.85)]'
                    : targetColor === 'yellow'
                    ? 'bg-amber-500 border-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.85)]'
                    : 'bg-emerald-500 border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.85)]'
                }`}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3 Signal Light Circles (Red, Yellow, Green) */}
        <div className="w-full glass-card p-6 rounded-3xl border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center justify-center gap-4 sm:gap-6 w-full py-4">
            {COLORS_ORDER.map((color) => {
              const isSelected = lastFeedback?.selected === color;

              return (
                <motion.button
                  key={color}
                  whileHover={canTap ? { scale: 1.08 } : {}}
                  whileTap={canTap ? { scale: 0.92 } : {}}
                  onClick={() => handleCircleTap(color)}
                  disabled={!canTap}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-blue-400 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-2xl ${canTap
                      ? 'opacity-100 hover:brightness-110'
                      : 'opacity-90 cursor-not-allowed'
                    }`}
                  style={{
                    backgroundColor: '#2563EB',
                    boxShadow: '0 10px 25px rgba(37,99,235,0.4)',
                  }}
                >

                  {/* Label inside circle */}
                  <span className="text-white font-extrabold text-sm sm:text-base tracking-wider uppercase drop-shadow-md">
                    {color === 'red' ? 'STOP' : color === 'yellow' ? 'SLOW' : 'GO'}
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
