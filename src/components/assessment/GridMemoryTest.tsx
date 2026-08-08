import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { AutoStartTimerBar } from '@/components/shared/AutoStartTimerBar';
import { CountdownRing } from '@/components/shared/CountdownRing';
import { useCountdown } from '@/hooks/useCountdown';
import { Grid3X3 } from 'lucide-react';
import { GRID_ROUNDS, GRID_SIZE, GRID_HIGHLIGHT_COUNT, GRID_DISPLAY_TIME, RECALL_TIME_LIMIT_SEC } from '@/lib/constants';
import { randomGridPositions } from '@/lib/utils';
import type { GridMemoryResult } from '@/types/assessment';

type Phase = 'intro' | 'display' | 'recall' | 'feedback' | 'done';

interface GridMemoryTestProps {
  onComplete: (result: GridMemoryResult) => void;
}

export function GridMemoryTest({ onComplete }: GridMemoryTestProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [roundResults, setRoundResults] = useState<{ correct: number; total: number; time: number }[]>([]);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [recallTimeLeft, setRecallTimeLeft] = useState<number>(RECALL_TIME_LIMIT_SEC);
  const roundStartRef = useRef(0);
  const recallTimerRef = useRef<any>(null);
  const selectedCellsRef = useRef<number[]>([]);
  selectedCellsRef.current = selectedCells;

  const countdown = useCountdown(GRID_DISPLAY_TIME, () => {
    setPhase('recall');
    roundStartRef.current = performance.now();
  });

  const startRound = useCallback(() => {
    const positions = randomGridPositions(GRID_SIZE, GRID_HIGHLIGHT_COUNT);
    setHighlightedCells(positions);
    setSelectedCells([]);
    setPhase('display');
    countdown.start();
  }, [countdown]);

  const executeSubmit = useCallback((finalSelections: number[]) => {
    if (recallTimerRef.current) clearInterval(recallTimerRef.current);

    const timeTaken = (performance.now() - roundStartRef.current) / 1000;
    const correct = finalSelections.filter((c) => highlightedCells.includes(c)).length;
    const mistakes = finalSelections.filter((c) => !highlightedCells.includes(c)).length;

    setTotalMistakes((prev) => prev + mistakes);
    const newResults = [...roundResults, { correct, total: GRID_HIGHLIGHT_COUNT, time: timeTaken }];
    setRoundResults(newResults);

    setPhase('feedback');

    const nextRound = round + 1;

    setTimeout(() => {
      if (nextRound >= GRID_ROUNDS) {
        setPhase('done');
        const avgAccuracy = (newResults.reduce((sum, r) => sum + (r.correct / r.total) * 100, 0)) / newResults.length;
        const avgTime = newResults.reduce((sum, r) => sum + r.time, 0) / newResults.length;

        setTimeout(() => {
          onComplete({
            accuracy: avgAccuracy,
            completionTime: avgTime,
            mistakes: totalMistakes + mistakes,
            rounds: newResults,
          });
        }, 1000);
      } else {
        setRound(nextRound);
        startRound();
      }
    }, 1500);
  }, [round, roundResults, highlightedCells, totalMistakes, startRound, onComplete]);

  useEffect(() => {
    if (phase === 'recall') {
      setRecallTimeLeft(RECALL_TIME_LIMIT_SEC);
      const interval = setInterval(() => {
        setRecallTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            executeSubmit(selectedCellsRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      recallTimerRef.current = interval;

      return () => {
        clearInterval(interval);
      };
    }
  }, [phase, executeSubmit]);

  const handleCellClick = (index: number) => {
    if (phase !== 'recall') return;

    if (selectedCells.includes(index)) {
      setSelectedCells((prev) => prev.filter((c) => c !== index));
    } else if (selectedCells.length < GRID_HIGHLIGHT_COUNT) {
      setSelectedCells((prev) => [...prev, index]);
    }
  };

  const handleSubmit = () => {
    executeSubmit(selectedCells);
  };

  const totalCells = GRID_SIZE * GRID_SIZE;

  if (phase === 'intro') {
    return (
      <PageTransition>
        <div className="w-full flex-1 flex flex-col items-center justify-between text-center px-6 py-6 sm:py-10 max-w-md sm:max-w-lg mx-auto min-h-[480px] sm:min-h-[520px]">
          {/* 7-Second Auto-Start Progress Bar */}
          <AutoStartTimerBar duration={7} onAutoStart={startRound} />

          {/* Top: Title & Subtitle */}
          <div className="space-y-3 pt-2">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Pattern Memory
            </h1>
            <p className="text-base sm:text-lg text-slate-200 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Memorize which green squares light up, then recreate the pattern
            </p>
          </div>

          {/* Center Hero Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-[36px] bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-400/80 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.35)] relative overflow-hidden my-4"
          >
            <div className="absolute inset-2 rounded-[28px] border border-emerald-400/30 pointer-events-none" />
            <Grid3X3 className="w-24 h-24 sm:w-28 sm:h-28 text-emerald-300 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
          </motion.div>

          {/* Bottom Pill Button */}
          <motion.button
            whileHover={{ scale: 1.06, boxShadow: '0 0 50px rgba(16,185,129,0.8)' }}
            whileTap={{ scale: 0.94 }}
            onClick={startRound}
            className="w-full sm:w-auto min-w-[280px] sm:min-w-[340px] py-6 sm:py-7 px-16 sm:px-24 min-h-[80px] sm:min-h-[88px] rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-2xl sm:text-3xl cursor-pointer shadow-2xl transition-all border-2 border-emerald-200/50"
          >
            Begin Test
          </motion.button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <h3 className="text-xl font-semibold mb-1">
          {phase === 'display' ? 'Memorize the pattern' : phase === 'recall' ? 'Recreate the pattern' : phase === 'feedback' ? 'Round Result' : 'Test Complete!'}
        </h3>
        <p className="text-sm mb-6" style={{ color: '#64748B' }}>
          Round {round + 1} of {GRID_ROUNDS}
        </p>

        {/* Countdown during display */}
        {phase === 'display' && (
          <div className="mb-6">
            <CountdownRing
              progress={countdown.progress}
              seconds={countdown.seconds}
              size={100}
              strokeWidth={5}
              color="#10B981"
            />
          </div>
        )}

        {/* Recall phase timer badge */}
        {phase === 'recall' && (
          <div className="mb-4 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-bold text-emerald-400">
            ⏱️ Time Limit: <span className="text-white font-extrabold">{recallTimeLeft}s</span>
          </div>
        )}

        {/* Grid */}
        {(phase === 'display' || phase === 'recall') && (
          <div
            className="grid gap-3 sm:gap-4 w-full max-w-sm sm:max-w-md mx-auto"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {Array.from({ length: totalCells }).map((_, i) => {
              const isHighlighted = phase === 'display' && highlightedCells.includes(i);
              const isSelected = phase === 'recall' && selectedCells.includes(i);

              return (
                <motion.button
                  key={i}
                  initial={isHighlighted ? { scale: 0.8 } : {}}
                  animate={isHighlighted ? { scale: 1 } : {}}
                  whileTap={phase === 'recall' ? { scale: 0.92 } : {}}
                  onClick={() => handleCellClick(i)}
                  className={`grid-cell ${isHighlighted ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                  disabled={phase === 'display'}
                  style={{ cursor: phase === 'recall' ? 'pointer' : 'default' }}
                />
              );
            })}
          </div>
        )}

        {/* Submit button during recall */}
        {phase === 'recall' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(16, 185, 129, 0.6)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={selectedCells.length === 0}
            className="mt-6 w-full max-w-sm sm:max-w-md py-6 px-10 rounded-3xl min-h-[72px] text-white font-black text-xl sm:text-2xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center flex items-center justify-center gap-3 shadow-2xl transition-all border border-emerald-400/40"
            style={{
              background: selectedCells.length > 0
                ? 'linear-gradient(135deg, #10B981, #14B8A6)'
                : 'rgba(255,255,255,0.1)',
            }}
          >
            <span>Submit Pattern</span>
            <span className="text-sm font-extrabold px-3 py-1 rounded-full bg-slate-950/40 text-emerald-200">
              {selectedCells.length}/{GRID_HIGHLIGHT_COUNT}
            </span>
          </motion.button>
        )}

        {/* Feedback */}
        {phase === 'feedback' && roundResults.length > 0 && (
          <>
            <div
              className="grid gap-3 sm:gap-4 w-full max-w-sm sm:max-w-md mx-auto mb-6"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
            >
              {Array.from({ length: totalCells }).map((_, i) => {
                const wasHighlighted = highlightedCells.includes(i);
                const wasSelected = selectedCells.includes(i);
                const isCorrect = wasHighlighted && wasSelected;
                const isIncorrect = !wasHighlighted && wasSelected;
                const isMissed = wasHighlighted && !wasSelected;

                return (
                  <div
                    key={i}
                    className={`grid-cell ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''} ${isMissed ? 'highlighted' : ''}`}
                    style={{ opacity: isMissed ? 0.5 : 1 }}
                  />
                );
              })}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold"
            >
              {roundResults[roundResults.length - 1].correct}/{GRID_HIGHLIGHT_COUNT} correct
            </motion.p>
          </>
        )}

        {/* Done */}
        {phase === 'done' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <p className="text-3xl font-bold mb-2">Test Complete! ✅</p>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
