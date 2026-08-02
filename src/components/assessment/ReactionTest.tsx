import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { Zap } from 'lucide-react';
import { REACTION_ROUNDS, REACTION_MIN_DELAY, REACTION_MAX_DELAY } from '@/lib/constants';
import { randomInt } from '@/lib/utils';

type Phase = 'intro' | 'waiting' | 'ready' | 'early' | 'result' | 'done';

interface ReactionTestProps {
  onComplete: (result: any) => void;
}

export function ReactionTest({ onComplete }: ReactionTestProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [missedTaps, setMissedTaps] = useState(0);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRound = useCallback(() => {
    setPhase('waiting');
    const delayMs = randomInt(REACTION_MIN_DELAY, REACTION_MAX_DELAY);

    timeoutRef.current = setTimeout(() => {
      setPhase('ready');
      startTimeRef.current = performance.now();
    }, delayMs);
  }, []);

  const handleTap = useCallback(() => {
    if (phase === 'waiting') {
      // Tapped too early!
      cleanup();
      const updatedMissed = missedTaps + 1;
      setMissedTaps(updatedMissed);
      // Record a 1200ms penalty attempt for pressing early
      setAttempts((prev) => [...prev, 1200]);
      setPhase('early');
      setTimeout(() => {
        startRound();
      }, 1500);
      return;
    }

    if (phase === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(elapsed);
      const newAttempts = [...attempts, elapsed];
      setAttempts(newAttempts);

      const nextRound = round + 1;
      setRound(nextRound);

      if (nextRound >= REACTION_ROUNDS) {
        setPhase('done');
        // Calculate result
        const avg = Math.round(newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length);
        const best = Math.min(...newAttempts);
        const worst = Math.max(...newAttempts);

        setTimeout(() => {
          onComplete({
            averageReaction: avg,
            bestReaction: best,
            worstReaction: worst,
            missedTaps,
            attempts: newAttempts,
          });
        }, 1500);
      } else {
        setPhase('result');
        setTimeout(() => {
          startRound();
        }, 1200);
      }
    }
  }, [phase, round, attempts, missedTaps, cleanup, startRound, onComplete]);

  if (phase === 'intro') {
    return (
      <PageTransition>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-3xl font-extrabold mb-4 text-center">Reaction Time</h2>
          <p className="text-center max-w-sm mb-3 leading-relaxed text-base" style={{ color: '#94A3B8' }}>
            When the screen turns <span className="text-emerald-400 font-bold">green</span>, tap as fast as you can!
          </p>
          <p className="text-center text-sm font-semibold mb-12" style={{ color: '#64748B' }}>
            {REACTION_ROUNDS} rounds • Don't tap early!
          </p>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(59,130,246,0.6)' }}
            whileTap={{ scale: 0.95 }}
            onClick={startRound}
            className="w-48 h-48 sm:w-56 sm:h-56 aspect-square rounded-3xl text-white font-black text-xl sm:text-2xl cursor-pointer text-center flex flex-col items-center justify-center gap-3 p-4 shadow-2xl transition-all"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
          >
            <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            <span>Begin Test</span>
          </motion.button>
        </div>
      </PageTransition>
    );
  }

  const bgClass =
    phase === 'ready'
      ? 'reaction-ready'
      : phase === 'early'
      ? 'reaction-early'
      : 'reaction-waiting';

  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center cursor-pointer select-none rounded-3xl p-8 sm:p-12 transition-all ${bgClass}`}
      onClick={handleTap}
      style={{ minHeight: '65vh' }}
    >
      {phase === 'waiting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-2xl font-bold text-white mb-2">Wait for green...</p>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            Round {round + 1} of {REACTION_ROUNDS}
          </p>
        </motion.div>
      )}

      {phase === 'ready' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.05 }}
          className="text-center"
        >
          <p className="text-4xl font-extrabold mb-2" style={{ color: '#0A0E1A' }}>TAP NOW!</p>
        </motion.div>
      )}

      {phase === 'early' && (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <p className="text-3xl font-bold text-white mb-2">Too early! ⚠️</p>
          <p className="text-sm text-white/70">Wait for the green screen</p>
        </motion.div>
      )}

      {phase === 'result' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-5xl font-extrabold text-white mb-2">{reactionTime} ms</p>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            {reactionTime < 350 ? '🔥 Excellent!' : reactionTime < 500 ? '👍 Good' : reactionTime < 700 ? '⚠️ Slow' : '🐢 Very slow'}
          </p>
          <p className="text-xs mt-4" style={{ color: '#64748B' }}>
            Round {round} of {REACTION_ROUNDS}
          </p>
        </motion.div>
      )}

      {phase === 'done' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-3xl font-bold text-white mb-2">Test Complete! ✅</p>
          <p className="text-lg" style={{ color: '#94A3B8' }}>
            Average: {Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)} ms
          </p>
        </motion.div>
      )}
    </div>
  );
}
