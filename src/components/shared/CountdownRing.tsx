import { motion } from 'framer-motion';

interface CountdownRingProps {
  progress: number; // 0 to 1
  seconds: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function CountdownRing({
  progress,
  seconds,
  size = 140,
  strokeWidth = 6,
  color = '#3B82F6',
}: CountdownRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
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
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </svg>
      {/* Center text */}
      <span className="text-3xl font-bold text-white tabular-nums">
        {seconds}
      </span>
    </div>
  );
}
