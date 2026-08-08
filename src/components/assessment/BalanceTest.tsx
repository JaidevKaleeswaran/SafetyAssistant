import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { AutoStartTimerBar } from '@/components/shared/AutoStartTimerBar';
import { ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { BALANCE_DURATION_SEC } from '@/lib/constants';
import type { BalanceTestResult } from '@/types/assessment';

interface BalanceTestProps {
  onComplete: (result: BalanceTestResult) => void;
}

export function BalanceTest({ onComplete }: BalanceTestProps) {
  const [phase, setPhase] = useState<'intro' | 'active' | 'completed'>('intro');
  const [timeLeft, setTimeLeft] = useState<number>(BALANCE_DURATION_SEC);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [stabilityScore, setStabilityScore] = useState(100);
  const [wobbleCount, setWobbleCount] = useState(0);
  const [isFlat, setIsFlat] = useState(true);

  const startTimeRef = useRef(0);
  const totalSamplesRef = useRef(0);
  const totalTiltSumRef = useRef(0);
  const maxTiltRef = useRef(0);
  const wobblesRef = useRef(0);
  const wasTiltedOutRef = useRef(false);

  // Orientation / Simulated Motion Handler
  useEffect(() => {
    if (phase !== 'active') return;

    let animFrame: number;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const p = e.beta || 0; // pitch: -180 to 180
      const r = e.gamma || 0; // roll: -90 to 90
      const tilt = Math.sqrt(p * p + r * r);

      setPitch(p);
      setRoll(r);
      totalSamplesRef.current += 1;
      totalTiltSumRef.current += tilt;
      if (tilt > maxTiltRef.current) maxTiltRef.current = tilt;

      if (tilt > 12) {
        setIsFlat(false);
        if (!wasTiltedOutRef.current) {
          wobblesRef.current += 1;
          setWobbleCount(wobblesRef.current);
          wasTiltedOutRef.current = true;
        }
      } else {
        setIsFlat(true);
        wasTiltedOutRef.current = false;
      }

      const tiltPenalty = Math.min(50, tilt * 2.5);
      const wobblePenalty = wobblesRef.current * 8;
      const score = Math.max(0, Math.min(100, 100 - tiltPenalty - wobblePenalty));
      setStabilityScore(Math.round(score));
    };

    if (window.DeviceOrientationEvent && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission().then((res: string) => {
        if (res === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      });
    } else if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    // Simulation loop if no sensor event
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, BALANCE_DURATION_SEC - elapsed);
      setTimeLeft(parseFloat(remaining.toFixed(1)));

      if (totalSamplesRef.current === 0) {
        // Gentle noise drift for simulation
        const simP = (Math.random() - 0.5) * 6;
        const simR = (Math.random() - 0.5) * 6;
        setPitch(simP);
        setRoll(simR);
        setStabilityScore(95);
        setIsFlat(true);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        finishTest();
      }
    }, 100);

    return () => {
      clearInterval(interval);
      window.removeEventListener('deviceorientation', handleOrientation);
      cancelAnimationFrame(animFrame);
    };
  }, [phase]);

  const startTest = () => {
    startTimeRef.current = performance.now();
    totalSamplesRef.current = 0;
    totalTiltSumRef.current = 0;
    maxTiltRef.current = 0;
    wobblesRef.current = 0;
    wasTiltedOutRef.current = false;
    setTimeLeft(BALANCE_DURATION_SEC);
    setPhase('active');
  };

  const finishTest = () => {
    setPhase('completed');
    const avgTilt = totalSamplesRef.current > 0 ? totalTiltSumRef.current / totalSamplesRef.current : 2.0;

    setTimeout(() => {
      onComplete({
        stabilityScore,
        completionTime: BALANCE_DURATION_SEC,
        avgTiltDegrees: Math.round(avgTilt * 10) / 10,
        maxTiltDegrees: Math.round(maxTiltRef.current * 10) / 10,
        wobbleCount: wobblesRef.current,
        passed: stabilityScore >= 80,
      });
    }, 1000);
  };

  if (phase === 'intro') {
    return (
      <PageTransition>
        <div className="w-full flex-1 flex flex-col items-center justify-between text-center px-6 py-6 sm:py-10 max-w-md sm:max-w-lg mx-auto min-h-[480px]">
          {/* 7-Second Auto Start Decreasing Progress Bar */}
          <AutoStartTimerBar duration={7} onAutoStart={startTest} />

          <div className="space-y-3 pt-2">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Palm Balance Test
            </h1>
            <p className="text-base sm:text-lg text-slate-200 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Place your phone flat on your open palm and hold it steady for 15 seconds
            </p>
          </div>

          {/* Hero Spirit Level Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-52 h-52 rounded-[36px] bg-gradient-to-br from-teal-950/80 via-slate-900 to-blue-950/80 border-2 border-teal-400/80 flex items-center justify-center shadow-[0_0_60px_rgba(20,184,166,0.35)] relative overflow-hidden my-4"
          >
            <div className="w-32 h-32 rounded-full border-2 border-slate-700/60 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-teal-400 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.8)]" />
              </div>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startTest}
            className="w-full py-6 px-10 rounded-full bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-2xl cursor-pointer shadow-2xl transition-all border-2 border-teal-200/50 flex items-center justify-center gap-3"
          >
            <span>Start Balance Test Now</span>
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </div>
      </PageTransition>
    );
  }

  if (phase === 'completed') {
    return (
      <PageTransition>
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center px-4 py-8 space-y-6">
          <ShieldCheck className="w-20 h-20 text-teal-400" />
          <h2 className="text-2xl font-black text-white">Palm Balance Complete!</h2>
          <p className="text-sm text-slate-400">Advancing to next test...</p>
        </div>
      </PageTransition>
    );
  }

  // Active Phase with Spirit Level
  const radius = 100;
  const offsetX = Math.max(-radius, Math.min(radius, (roll / 30) * radius));
  const offsetY = Math.max(-radius, Math.min(radius, (pitch / 30) * radius));

  return (
    <PageTransition>
      <div className="w-full flex-1 flex flex-col items-center justify-start text-center px-4 pt-2 max-w-md mx-auto space-y-4">
        {/* HUD Top Bar */}
        <div className="w-full glass-card p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between shadow-xl">
          <div className="text-left">
            <span className="text-[11px] font-extrabold text-teal-400 uppercase tracking-wider">TIME REMAINING</span>
            <p className="text-base font-extrabold text-white">{timeLeft.toFixed(1)}s</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">STABILITY SCORE</span>
            <p className={`text-lg font-black ${stabilityScore >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stabilityScore}%
            </p>
          </div>
        </div>

        {/* Spirit Level Target Canvas */}
        <div
          className={`w-full aspect-square rounded-3xl glass-card border-2 flex items-center justify-center relative overflow-hidden transition-all shadow-2xl ${
            isFlat ? 'border-teal-500 bg-slate-950/90 glow-green' : 'border-rose-500 bg-rose-950/20 glow-red'
          }`}
        >
          {/* Target Concentric Circles */}
          <div className="w-64 h-64 rounded-full border border-slate-700/60 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-2 border-teal-500/40 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-teal-400 flex items-center justify-center" />
            </div>
          </div>

          {/* Dynamic Floating Bubble Target */}
          <motion.div
            animate={{ x: offsetX, y: offsetY }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`absolute w-12 h-12 rounded-full border-2 shadow-2xl flex items-center justify-center ${
              isFlat ? 'bg-gradient-to-r from-teal-400 to-emerald-500 border-white shadow-[0_0_25px_rgba(20,184,166,0.8)]' : 'bg-rose-600 border-white shadow-[0_0_25px_rgba(239,68,68,0.8)]'
            }`}
          />

          {/* Status Banner */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full backdrop-blur-md border text-xs font-black shadow-xl pointer-events-none">
            {isFlat ? (
              <span className="bg-teal-500/20 border-teal-500/40 text-teal-300 px-4 py-1.5 rounded-full flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                PERFECT BALANCE — HOLD STILL!
              </span>
            ) : (
              <span className="bg-rose-500/20 border-rose-500/40 text-rose-300 px-4 py-1.5 rounded-full flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                ⚠️ TILT DETECTED — FLATTEN PHONE ON PALM!
              </span>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
