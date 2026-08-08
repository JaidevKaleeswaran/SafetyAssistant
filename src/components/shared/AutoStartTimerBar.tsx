import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { AUTO_START_DURATION_SEC } from '@/lib/constants';

interface AutoStartTimerBarProps {
  duration?: number; // seconds
  onAutoStart: () => void;
}

export function AutoStartTimerBar({
  duration = AUTO_START_DURATION_SEC,
  onAutoStart,
}: AutoStartTimerBarProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(duration);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setSecondsRemaining(Math.ceil(remaining));

      if (remaining <= 0) {
        clearInterval(interval);
        onAutoStart();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onAutoStart]);

  return (
    <div
      onClick={onAutoStart}
      className="w-full max-w-md mx-auto px-4 py-3 bg-slate-900/80 border border-teal-500/30 rounded-2xl shadow-xl space-y-2 cursor-pointer hover:border-teal-400 transition-all"
    >
      <div className="flex items-center justify-between text-xs font-bold">
        <div className="flex items-center gap-1.5 text-teal-400 uppercase tracking-wider">
          <Timer className="w-4 h-4 animate-pulse" />
          <span>AUTO-STARTING TEST IN</span>
        </div>
        <span className="text-white font-extrabold text-sm">{secondsRemaining}s</span>
      </div>

      {/* Horizontally Stretched Decreasing Progress Bar */}
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-teal-400 to-blue-500 rounded-full shadow-[0_0_12px_rgba(20,184,166,0.6)]"
        />
      </div>
    </div>
  );
}
