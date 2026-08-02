import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { Brain } from 'lucide-react';
import { EMOJI_POOL, EMOJI_ROUNDS, EMOJI_COUNT, EMOJI_DISPLAY_TIME } from '@/lib/constants';
import { pickRandom } from '@/lib/utils';
import type { EmojiMemoryResult } from '@/types/assessment';

type Phase = 'intro' | 'display' | 'recall' | 'feedback' | 'done';

interface EmojiMemoryTestProps {
  onComplete: (result: EmojiMemoryResult) => void;
}

export function EmojiMemoryTest({ onComplete }: EmojiMemoryTestProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [targetEmojis, setTargetEmojis] = useState<string[]>([]);
  const [choiceEmojis, setChoiceEmojis] = useState<string[]>([]);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [roundResults, setRoundResults] = useState<{ correct: number; total: number; time: number }[]>([]);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const roundStartRef = useRef(0);

  const startRound = useCallback(() => {
    const targets = pickRandom(EMOJI_POOL, EMOJI_COUNT);
    setTargetEmojis(targets);
    setSelectedEmojis([]);

    // Create choices: targets + distractors
    const remaining = EMOJI_POOL.filter((e) => !targets.includes(e));
    const distractors = pickRandom(remaining, EMOJI_COUNT);
    setChoiceEmojis([...targets, ...distractors].sort(() => Math.random() - 0.5));

    setPhase('display');

    // Auto-hide after display time
    setTimeout(() => {
      setPhase('recall');
      roundStartRef.current = performance.now();
    }, EMOJI_DISPLAY_TIME);
  }, []);

  const handleSelect = (emoji: string) => {
    if (selectedEmojis.includes(emoji)) {
      setSelectedEmojis((prev) => prev.filter((e) => e !== emoji));
      return;
    }
    if (selectedEmojis.length >= EMOJI_COUNT) return;

    const newSelected = [...selectedEmojis, emoji];
    setSelectedEmojis(newSelected);

    if (newSelected.length === EMOJI_COUNT) {
      // Score this round
      const timeTaken = (performance.now() - roundStartRef.current) / 1000;
      let correct = 0;
      let mistakes = 0;

      newSelected.forEach((sel, i) => {
        if (sel === targetEmojis[i]) {
          correct++;
        } else {
          mistakes++;
        }
      });

      setTotalMistakes((prev) => prev + mistakes);
      const newResults = [...roundResults, { correct, total: EMOJI_COUNT, time: timeTaken }];
      setRoundResults(newResults);

      setPhase('feedback');

      const nextRound = round + 1;

      setTimeout(() => {
        if (nextRound >= EMOJI_ROUNDS) {
          setPhase('done');
          const avgAccuracy = (newResults.reduce((sum, r) => sum + (r.correct / r.total) * 100, 0)) / newResults.length;
          const avgTime = newResults.reduce((sum, r) => sum + r.time, 0) / newResults.length;

          setTimeout(() => {
            onComplete({
              accuracy: avgAccuracy,
              timeTaken: avgTime,
              mistakes: totalMistakes + mistakes,
              rounds: newResults,
            });
          }, 1000);
        } else {
          setRound(nextRound);
          startRound();
        }
      }, 1500);
    }
  };

  if (phase === 'intro') {
    return (
      <PageTransition>
        <div className="w-full flex-1 flex flex-col items-center justify-between text-center px-6 py-6 sm:py-10 max-w-md sm:max-w-lg mx-auto min-h-[480px] sm:min-h-[520px]">
          {/* Top: Title & Subtitle */}
          <div className="space-y-3 pt-2">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Emoji Memory
            </h1>
            <p className="text-base sm:text-lg text-slate-200 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Memorize the emojis and their order, then select them back
            </p>
          </div>

          {/* Center Hero Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-[36px] bg-gradient-to-br from-purple-950/80 via-slate-900 to-pink-950/80 border-2 border-purple-400/80 flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.35)] relative overflow-hidden my-4"
          >
            <div className="absolute inset-2 rounded-[28px] border border-purple-400/30 pointer-events-none" />
            <Brain className="w-24 h-24 sm:w-28 sm:h-28 text-purple-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
          </motion.div>

          {/* Bottom Pill Button */}
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(168,85,247,0.6)' }}
            whileTap={{ scale: 0.95 }}
            onClick={startRound}
            className="py-4 px-14 sm:px-16 rounded-full bg-purple-400 hover:bg-purple-300 text-slate-950 font-extrabold text-lg sm:text-xl cursor-pointer shadow-xl transition-all"
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
        <h3 className="text-xl font-semibold mb-2">
          {phase === 'display' ? 'Memorize these emojis!' : phase === 'recall' ? 'Select them in order' : phase === 'feedback' ? 'Round Result' : 'Test Complete!'}
        </h3>
        <p className="text-sm mb-8" style={{ color: '#64748B' }}>
          Round {round + 1} of {EMOJI_ROUNDS}
        </p>

        {/* Display phase — show target emojis with clear order badges */}
        {phase === 'display' && (
          <div className="w-full max-w-md mx-auto space-y-6 my-4">
            <div className="flex justify-center items-center gap-3 sm:gap-4 p-5 sm:p-6 glass-card rounded-3xl w-full border border-slate-700/80 shadow-2xl">
              {targetEmojis.map((emoji, i) => (
                <div key={`target-${i}`} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                    #{i + 1}
                  </span>
                  <div
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-2 border-teal-500/60 flex items-center justify-center text-3xl sm:text-5xl shadow-xl leading-none select-none"
                    style={{
                      fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol', sans-serif",
                      WebkitTextFillColor: 'initial',
                      color: '#ffffff',
                      boxShadow: '0 0 25px rgba(20, 184, 166, 0.4)',
                    }}
                  >
                    {emoji}
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: EMOJI_DISPLAY_TIME / 1000, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Recall phase — show choices */}
        {phase === 'recall' && (
          <>
            {/* Selected display */}
            <div className="flex gap-2.5 sm:gap-3 mb-6 min-h-[4.5rem] justify-center items-center">
              {Array.from({ length: EMOJI_COUNT }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center text-2xl sm:text-3xl leading-none select-none transition-all shadow-md"
                  style={{
                    background: selectedEmojis[i] ? 'rgba(59,130,246,0.2)' : 'rgba(15,23,42,0.6)',
                    border: selectedEmojis[i] ? '2px solid #3B82F6' : '2px dashed rgba(255,255,255,0.15)',
                    fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol', sans-serif",
                    WebkitTextFillColor: 'initial',
                    color: '#ffffff',
                  }}
                >
                  {selectedEmojis[i] || (
                    <span className="text-[10px] font-bold text-slate-500">#{i + 1}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Choice grid */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-sm sm:max-w-md mx-auto">
              {choiceEmojis.map((emoji, i) => (
                <motion.button
                  key={`choice-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleSelect(emoji)}
                  className={`emoji-card cursor-pointer ${selectedEmojis.includes(emoji) ? 'selected' : ''}`}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </>
        )}

        {/* Feedback */}
        {phase === 'feedback' && roundResults.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <p className="text-4xl font-bold mb-2">
              {roundResults[roundResults.length - 1].correct}/{EMOJI_COUNT}
            </p>
            <p style={{ color: '#94A3B8' }}>
              {roundResults[roundResults.length - 1].correct === EMOJI_COUNT
                ? '🎉 Perfect!'
                : roundResults[roundResults.length - 1].correct >= EMOJI_COUNT - 1
                  ? '👍 Almost!'
                  : '🔄 Keep trying'}
            </p>
          </motion.div>
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
