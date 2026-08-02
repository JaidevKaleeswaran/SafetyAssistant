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

        {/* Display phase — show target emojis with wide spacing */}
        {phase === 'display' && (
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 my-8 p-8 glass-card rounded-3xl w-full max-w-md mx-auto">
            {targetEmojis.map((emoji, i) => (
              <motion.div
                key={`target-${i}`}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.15, type: 'spring' }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-3xl sm:text-4xl shadow-xl"
                style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)', fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif" }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        )}

        {/* Recall phase — show choices */}
        {phase === 'recall' && (
          <>
            {/* Selected display */}
            <div className="flex gap-3 mb-6 min-h-[4.5rem]">
              {Array.from({ length: EMOJI_COUNT }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: selectedEmojis[i] ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    border: selectedEmojis[i] ? '2px solid #3B82F6' : '2px dashed rgba(255,255,255,0.1)',
                    fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif",
                  }}
                >
                  {selectedEmojis[i] || ''}
                </div>
              ))}
            </div>

            {/* Choice grid */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full max-w-sm sm:max-w-md mx-auto">
              {choiceEmojis.map((emoji, i) => (
                <motion.button
                  key={`choice-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
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
