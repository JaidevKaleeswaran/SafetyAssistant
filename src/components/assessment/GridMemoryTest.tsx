import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { CountdownRing } from '@/components/shared/CountdownRing';
import { useCountdown } from '@/hooks/useCountdown';
import { Grid3X3 } from 'lucide-react';
import { GRID_ROUNDS, GRID_SIZE, GRID_HIGHLIGHT_COUNT, GRID_DISPLAY_TIME } from '@/lib/constants';
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
  const roundStartRef = useRef(0);

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

  const handleCellClick = (index: number) => {
    if (phase !== 'recall') return;

    if (selectedCells.includes(index)) {
      setSelectedCells((prev) => prev.filter((c) => c !== index));
    } else if (selectedCells.length < GRID_HIGHLIGHT_COUNT) {
      setSelectedCells((prev) => [...prev, index]);
    }
  };

  const handleSubmit = () => {
    const timeTaken = (performance.now() - roundStartRef.current) / 1000;
    const correct = selectedCells.filter((c) => highlightedCells.includes(c)).length;
    const mistakes = selectedCells.filter((c) => !highlightedCells.includes(c)).length;

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
  };

  const totalCells = GRID_SIZE * GRID_SIZE;

  if (phase === 'intro') {
    return (
      <PageTransition>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
            style={{ background: 'linear-gradient(135deg, #10B981, #14B8A6)' }}
          >
            <Grid3X3 className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-3xl font-extrabold mb-4 text-center">Visual Pattern Memory</h2>
          <p className="text-center max-w-sm mb-3 leading-relaxed text-base" style={{ color: '#94A3B8' }}>
            <span className="text-emerald-400 font-semibold">{GRID_HIGHLIGHT_COUNT} cells</span> will light up. Memorize their positions, then recreate the pattern.
          </p>
          <p className="text-center text-sm font-semibold mb-6 text-slate-400">
            {GRID_ROUNDS} rounds • {GRID_DISPLAY_TIME / 1000} seconds to memorize
          </p>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 35px rgba(16,185,129,0.6)' }}
            whileTap={{ scale: 0.97 }}
            onClick={startRound}
            className="w-full max-w-sm sm:max-w-md min-h-[72px] sm:min-h-[80px] py-5 sm:py-6 px-8 rounded-3xl text-white font-black text-xl sm:text-2xl cursor-pointer text-center flex items-center justify-center gap-3 shadow-2xl transition-all mt-4 border border-emerald-400/40"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <Grid3X3 className="w-8 h-8 text-white flex-shrink-0" />
            <span>Begin Test</span>
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={selectedCells.length !== GRID_HIGHLIGHT_COUNT}
            className="mt-8 w-full max-w-xs sm:max-w-sm py-5 px-8 rounded-2xl text-white font-semibold text-sm sm:text-base cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-center flex items-center justify-center"
            style={{ background: selectedCells.length === GRID_HIGHLIGHT_COUNT ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : 'rgba(255,255,255,0.1)' }}
          >
            Submit ({selectedCells.length}/{GRID_HIGHLIGHT_COUNT})
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
