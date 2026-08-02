import { motion } from 'framer-motion';
import { TEST_STEPS } from '@/types/assessment';

interface ProgressBarProps {
  currentStep: number;
}

const stepLabels = ['Object Tracking', 'Emoji Memory', 'Pattern', 'Voice AI', 'Signal Light'];

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const progress = ((currentStep + 1) / TEST_STEPS.length) * 100;

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center">
      <div className="flex justify-between w-full mb-2 gap-1">
        {stepLabels.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] sm:text-xs font-semibold transition-colors duration-300 ${
              i <= currentStep ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #3B82F6, #14B8A6)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="text-xs font-medium text-slate-400">
        Phase {currentStep + 1} of {TEST_STEPS.length}: <span className="text-white font-semibold">{stepLabels[currentStep]}</span>
      </p>
    </div>
  );
}
