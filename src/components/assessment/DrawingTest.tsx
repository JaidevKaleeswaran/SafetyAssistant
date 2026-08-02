import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { Target, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import type { DrawingTestResult } from '@/types/assessment';

interface DrawingTestProps {
  onComplete: (result: DrawingTestResult) => void;
}

const TEST_DURATION_SEC = 15;
const BOX_SIZE_PX = 72; // Size of moving target box

export function DrawingTest({ onComplete }: DrawingTestProps) {
  const [phase, setPhase] = useState<'intro' | 'active' | 'completed'>('intro');
  const [timeLeft, setTimeLeft] = useState<number>(TEST_DURATION_SEC);
  const [isInside, setIsInside] = useState<boolean>(false);
  const [liveAccuracy, setLiveAccuracy] = useState<number>(100);
  const [lostTargetCount, setLostTargetCount] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const totalTicksRef = useRef<number>(0);
  const insideTicksRef = useRef<number>(0);
  const wasInsideRef = useRef<boolean>(false);

  // Active Velocity & Motion Physics State
  const boxPosRef = useRef<{ x: number; y: number; vx: number; vy: number }>({
    x: 100,
    y: 100,
    vx: 180, // pixels per second x
    vy: 140, // pixels per second y
  });
  const lastTimeRef = useRef<number>(0);

  // Smooth 60FPS Direct Physics & Motion Loop
  const updateGameLoop = useCallback((timestamp: number) => {
    if (phase !== 'active') return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    lastTimeRef.current = timestamp;

    const container = containerRef.current;
    const box = boxRef.current;

    if (container && box) {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, TEST_DURATION_SEC - elapsedSec);
      setTimeLeft(parseFloat(remaining.toFixed(1)));

      if (remaining <= 0) {
        finishTest();
        return;
      }

      // Update Box Position using Continuous Dynamic Curve + Bounce Physics
      const pos = boxPosRef.current;
      const halfBox = BOX_SIZE_PX / 2;

      // Primary continuous Lissajous trajectory with slower smooth pursuit (0.65x speed)
      const t = elapsedSec * 0.65;
      const radiusX = Math.max(80, (width - BOX_SIZE_PX) / 2 - 10);
      const radiusY = Math.max(80, (height - BOX_SIZE_PX) / 2 - 10);
      const centerX = width / 2;
      const centerY = height / 2;

      pos.x = centerX + radiusX * Math.sin(t * 1.2);
      pos.y = centerY + radiusY * Math.sin(t * 0.9) * Math.cos(t * 0.4);

      // Clamp within container bounds
      pos.x = Math.max(halfBox, Math.min(width - halfBox, pos.x));
      pos.y = Math.max(halfBox, Math.min(height - halfBox, pos.y));

      // Direct 60FPS GPU Transform Update (No React state re-render bottleneck)
      box.style.transform = `translate3d(${pos.x - halfBox}px, ${pos.y - halfBox}px, 0px)`;

      // Bounding Box Collision Check against Pointer
      const pointer = pointerPosRef.current;
      totalTicksRef.current += 1;

      let currentlyInside = false;
      if (pointer) {
        const minX = pos.x - halfBox;
        const maxX = pos.x + halfBox;
        const minY = pos.y - halfBox;
        const maxY = pos.y + halfBox;

        if (pointer.x >= minX && pointer.x <= maxX && pointer.y >= minY && pointer.y <= maxY) {
          currentlyInside = true;
        }
      }

      if (currentlyInside) {
        insideTicksRef.current += 1;
        setIsInside(true);
        wasInsideRef.current = true;
      } else {
        setIsInside(false);
        if (wasInsideRef.current) {
          setLostTargetCount((prev) => prev + 1);
          wasInsideRef.current = false;
        }
      }

      // Live Accuracy Calculation
      const accuracy = totalTicksRef.current > 0
        ? Math.round((insideTicksRef.current / totalTicksRef.current) * 100)
        : 100;
      setLiveAccuracy(accuracy);
    }

    animFrameRef.current = requestAnimationFrame(updateGameLoop);
  }, [phase]);

  useEffect(() => {
    if (phase === 'active') {
      startTimeRef.current = performance.now();
      lastTimeRef.current = 0;
      totalTicksRef.current = 0;
      insideTicksRef.current = 0;
      wasInsideRef.current = false;
      animFrameRef.current = requestAnimationFrame(updateGameLoop);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [phase, updateGameLoop]);

  const startTest = () => {
    setPhase('active');
    setTimeLeft(TEST_DURATION_SEC);
    setLiveAccuracy(100);
    setIsInside(false);
    setLostTargetCount(0);
    pointerPosRef.current = null;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      boxPosRef.current = {
        x: rect.width / 2,
        y: rect.height / 2,
        vx: 180,
        vy: 140,
      };
    }
  };

  const finishTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setPhase('completed');

    const finalAccuracy = totalTicksRef.current > 0
      ? Math.round((insideTicksRef.current / totalTicksRef.current) * 100)
      : 100;

    setTimeout(() => {
      onComplete({
        accuracy: finalAccuracy,
        completionTime: TEST_DURATION_SEC,
        avgDeviationPx: Math.max(0, 100 - finalAccuracy),
        offPathCount: lostTargetCount,
        passed: finalAccuracy >= 80,
      });
    }, 1000);
  };

  // Pointer & Touch Handlers
  const updatePointerFromEvent = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    pointerPosRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerLeave = () => {
    pointerPosRef.current = null;
    setIsInside(false);
  };

  // INTRO PHASE
  if (phase === 'intro') {
    return (
      <PageTransition>
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center px-4 py-6 max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2 flex flex-col items-center justify-center pt-2">
            <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wider">
              Phase 1: Smooth Pursuit Tracking
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Moving Target Pursuit
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed pt-1">
              Keep your cursor or finger inside the glowing target box as it actively moves around the screen for 15 seconds.
            </p>
          </div>

          <div className="w-full max-w-sm glass-card p-6 rounded-3xl border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xl">
              <Target className="w-10 h-10" />
            </div>

            <div className="text-xs text-slate-300 space-y-2.5 text-left w-full px-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                <span>Keep pointer inside the moving box for <strong>15 seconds</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4.5 h-4.5 text-teal-400 flex-shrink-0" />
                <span>Accuracy increases when cursor is inside the box</span>
              </div>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-400 flex-shrink-0" />
                <span>Straying outside target drops tracking accuracy</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 35px rgba(20,184,166,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={startTest}
              className="w-full min-h-[100px] py-6 px-6 rounded-3xl bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-500 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xl sm:text-2xl cursor-pointer text-center flex flex-col items-center justify-center gap-3 shadow-2xl transition-all border border-teal-400/40"
            >
              <Target className="w-10 h-10 text-white" />
              <span>Begin Object Tracking Test</span>
              <span className="text-xs font-semibold text-white/80">Tap to start active target pursuit</span>
            </motion.button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // COMPLETED PHASE
  if (phase === 'completed') {
    return (
      <PageTransition>
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center px-4 py-8 max-w-md mx-auto space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Target Pursuit Complete!</h2>
            <p className="text-sm text-slate-400 mt-1">Advancing to next phase...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="w-full flex-1 flex flex-col justify-between items-center text-center px-4 py-4 max-w-md sm:max-w-lg mx-auto space-y-4">
        {/* HUD Top Bar */}
        <div className="w-full glass-card p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center font-black text-white text-base">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isInside ? 'text-teal-400' : 'text-rose-500'}
                  strokeDasharray={`${((15 - timeLeft) / 15) * 100}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute">{timeLeft.toFixed(0)}s</span>
            </div>
            <div className="text-left">
              <span className="text-[11px] font-extrabold text-teal-400 uppercase tracking-wider">Time Remaining</span>
              <p className="text-sm font-extrabold text-white">{timeLeft} seconds</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tracking Accuracy</p>
            <span className={`text-base font-extrabold ${liveAccuracy >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {liveAccuracy}%
            </span>
          </div>
        </div>

        {/* Interactive Viewfinder Container for Pursuit */}
        <div
          ref={containerRef}
          onPointerDown={(e) => updatePointerFromEvent(e.clientX, e.clientY)}
          onPointerMove={(e) => updatePointerFromEvent(e.clientX, e.clientY)}
          onPointerLeave={handlePointerLeave}
          onTouchStart={(e) => {
            if (e.touches[0]) updatePointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) updatePointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
          }}
          className={`w-full relative aspect-square rounded-3xl overflow-hidden glass-card border-2 transition-all duration-300 shadow-2xl flex items-start justify-start p-0 cursor-crosshair touch-none ${isInside
              ? 'border-emerald-500 bg-slate-950/90 glow-green'
              : 'border-rose-500 bg-rose-950/20 glow-red'
            }`}
        >
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

          {/* Actively Moving Target Box (Direct 60FPS GPU Transform) */}
          <div
            ref={boxRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: BOX_SIZE_PX,
              height: BOX_SIZE_PX,
              willChange: 'transform',
            }}
            className={`rounded-2xl border-2 flex items-center justify-center transition-colors duration-200 shadow-2xl ${isInside
                ? 'border-emerald-400 bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-[0_0_35px_rgba(20,184,166,0.9)] scale-105'
                : 'border-rose-500/80 bg-slate-900/90 text-rose-400 shadow-[0_0_25px_rgba(239,68,68,0.6)]'
              }`}
          >
            {/* Target Reticle Crosshair inside Box */}
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
              <Target className={`w-8 h-8 ${isInside ? 'animate-pulse text-white' : 'text-rose-400'}`} />
              <span className={`absolute inset-0 rounded-2xl animate-ping opacity-30 ${isInside ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            </div>
          </div>

          {/* Status Banner overlay at bottom of viewport */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full backdrop-blur-md border text-xs sm:text-sm font-extrabold tracking-wide shadow-xl pointer-events-none transition-all">
            {isInside ? (
              <span className="bg-emerald-500/20 border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-full flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
                🎯 TARGET LOCKED — KEEP CURSOR INSIDE BOX!
              </span>
            ) : (
              <span className="bg-rose-500/20 border-rose-500/40 text-rose-300 px-4 py-1.5 rounded-full flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                ⚠️ TARGET LOST — MOVE CURSOR ONTO BOX!
              </span>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
