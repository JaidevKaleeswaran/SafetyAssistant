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
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-3xl font-extrabold mb-4 text-center">Emoji Memory</h2>
          <p className="text-center max-w-sm mb-3 leading-relaxed text-base" style={{ color: '#94A3B8' }}>
            Memorize the emojis and their <span className="text-blue-400 font-semibold">exact order</span>, then select them back.
          </p>
          <p className="text-center text-sm font-semibold mb-12" style={{ color: '#64748B' }}>
            {EMOJI_ROUNDS} rounds • {EMOJI_COUNT} emojis each
          </p>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(59,130,246,0.6)' }}
            whileTap={{ scale: 0.95 }}
            onClick={startRound}
            className="w-48 h-48 sm:w-56 sm:h-56 aspect-square rounded-3xl text-white font-black text-xl sm:text-2xl cursor-pointer text-center flex flex-col items-center justify-center gap-3 p-4 shadow-2xl transition-all"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
          >
            <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            <span>Begin Test</span>
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
