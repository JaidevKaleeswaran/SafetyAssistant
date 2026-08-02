import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfidenceRingProps {
  value: number; // 0–100
  color: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ConfidenceRing({
  value,
  color,
  size = 160,
  strokeWidth = 8,
  label = '% Sober',
}: ConfidenceRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animatedValue / 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 12px ${color}60)` }}
        />
      </svg>
      <div className="text-center flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-black text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {animatedValue}%
        </motion.span>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
