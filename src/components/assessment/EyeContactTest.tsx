import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { Eye, EyeOff, Camera, AlertCircle, CheckCircle2, ArrowUp, Sparkles } from 'lucide-react';
import { EYE_CONTACT_DURATION, EYE_CONTACT_PASS_PERCENTAGE, GEMINI_API_KEY } from '@/lib/constants';
import type { EyeContactTestResult } from '@/types/assessment';

interface EyeContactTestProps {
  onComplete: (result: EyeContactTestResult) => void;
}

type StepState = 'intro' | 'active' | 'complete';

interface GeminiVisionAnalysis {
  lookingAtCamera: boolean;
  confidence: number;
  reason: string;
}

export function EyeContactTest({ onComplete }: EyeContactTestProps) {
  const [stepState, setStepState] = useState<StepState>('intro');
  const [timeLeft, setTimeLeft] = useState<number>(EYE_CONTACT_DURATION);
  const [isLookingAway, setIsLookingAway] = useState<boolean>(false);
  const [lookAwayCount, setLookAwayCount] = useState<number>(0);
  const [eyeContactTime, setEyeContactTime] = useState<number>(0);
  const [hasWebcam, setHasWebcam] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<GeminiVisionAnalysis | null>(null);
  const [isAnalyzingGemini, setIsAnalyzingGemini] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const geminiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLookingAwayRef = useRef<boolean>(false);
  const eyeContactTimeRef = useRef<number>(0);
  const lookAwayCountRef = useRef<number>(0);
  const lastLookAwayStateRef = useRef<boolean>(false);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  // Stop camera stream & timers on unmount
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (geminiTimerRef.current) clearInterval(geminiTimerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopCamera]);

  // Start webcam feed
  const startCamera = async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasWebcam(true);
    } catch (err: any) {
      console.warn('Webcam permission denied or unavailable:', err);
      setWebcamError('Camera unavailable — using interactive gaze hold mode.');
      setHasWebcam(false);
    }
  };

  // Toggle or trigger look-away state
  const handleLookAwayToggle = useCallback((lookingAway: boolean) => {
    isLookingAwayRef.current = lookingAway;
    setIsLookingAway(lookingAway);

    if (lookingAway && !lastLookAwayStateRef.current) {
      lookAwayCountRef.current += 1;
      setLookAwayCount(lookAwayCountRef.current);
    }
    lastLookAwayStateRef.current = lookingAway;
  }, []);

  // Google Gemini 1.5 Flash Vision API Eye Contact Classifier
  const analyzeWithGeminiVision = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, 320, 240);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) return;

    setIsAnalyzingGemini(true);

    try {
      const apiKey = GEMINI_API_KEY || (import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '');
      if (!apiKey) {
        setIsAnalyzingGemini(false);
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64Data,
                    },
                  },
                  {
                    text: 'Analyze this webcam photo of a driver/person. Are their eyes looking directly into the camera lens with focused eye contact? Respond strictly in valid JSON format: {"lookingAtCamera": boolean, "confidence": number, "reason": string}',
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText) as GeminiVisionAnalysis;
          setGeminiStatus(parsed);

          if (!parsed.lookingAtCamera) {
            handleLookAwayToggle(true);
          } else {
            handleLookAwayToggle(false);
          }
        }
      }
    } catch (e) {
      console.warn('Gemini Vision API call failed, using canvas fallback:', e);
    } finally {
      setIsAnalyzingGemini(false);
    }
  }, [handleLookAwayToggle]);

  // Fallback Canvas luminance & upper-center variance analysis
  const analyzeVideoFrameFallback = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, 160, 120);

    try {
      const frame = ctx.getImageData(0, 0, 160, 120);
      const data = frame.data;

      // Calculate brightness
      let totalLuma = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLuma = totalLuma / (data.length / 4);

      if (avgLuma < 20) {
        handleLookAwayToggle(true);
        return;
      }

      // Upper center region check
      let upperLuma = 0;
      let upperPixels = 0;
      let upperVariance = 0;

      for (let y = 10; y < 60; y++) {
        for (let x = 40; x < 120; x++) {
          const idx = (y * 160 + x) * 4;
          const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          upperLuma += luma;
          upperPixels++;
        }
      }
      const upperAvgLuma = upperLuma / upperPixels;

      for (let y = 10; y < 60; y++) {
        for (let x = 40; x < 120; x++) {
          const idx = (y * 160 + x) * 4;
          const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          upperVariance += Math.abs(luma - upperAvgLuma);
        }
      }
      const avgVariance = upperVariance / upperPixels;

      let motionDiff = 0;
      if (prevFrameDataRef.current && prevFrameDataRef.current.length === data.length) {
        const prev = prevFrameDataRef.current;
        for (let i = 0; i < data.length; i += 16) {
          motionDiff += Math.abs(data[i] - prev[i]);
        }
        motionDiff = motionDiff / (data.length / 16);
      }
      prevFrameDataRef.current = new Uint8ClampedArray(data);

      if (avgVariance < 8 || motionDiff > 80) {
        handleLookAwayToggle(true);
      }
    } catch (e) {
      console.warn('Canvas frame analysis error:', e);
    }
  }, [handleLookAwayToggle]);

  // Begin the 15-second eye contact test
  const startTest = async () => {
    await startCamera();
    setStepState('active');
    setTimeLeft(EYE_CONTACT_DURATION);
    setEyeContactTime(0);
    setLookAwayCount(0);
    setIsLookingAway(false);
    setGeminiStatus(null);
    eyeContactTimeRef.current = 0;
    lookAwayCountRef.current = 0;
    isLookingAwayRef.current = false;
    lastLookAwayStateRef.current = false;
    prevFrameDataRef.current = null;

    const tickIntervalMs = 100;
    const totalTicks = (EYE_CONTACT_DURATION * 1000) / tickIntervalMs;
    let tickCount = 0;

    // Trigger initial Gemini Vision analysis and set 1.5s interval
    analyzeWithGeminiVision();
    geminiTimerRef.current = setInterval(() => {
      analyzeWithGeminiVision();
    }, 1500);

    timerRef.current = setInterval(() => {
      tickCount++;
      const currentSecondsLeft = Math.max(0, EYE_CONTACT_DURATION - tickCount * (tickIntervalMs / 1000));
      setTimeLeft(parseFloat(currentSecondsLeft.toFixed(1)));

      analyzeVideoFrameFallback();

      if (!isLookingAwayRef.current) {
        eyeContactTimeRef.current += tickIntervalMs / 1000;
        setEyeContactTime(parseFloat(eyeContactTimeRef.current.toFixed(1)));
      }

      if (tickCount >= totalTicks) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (geminiTimerRef.current) clearInterval(geminiTimerRef.current);
        finishTest();
      }
    }, tickIntervalMs);
  };

  const finishTest = () => {
    setStepState('complete');
    stopCamera();

    const finalContactTime = eyeContactTimeRef.current;
    const percentage = Math.min(100, Math.round((finalContactTime / EYE_CONTACT_DURATION) * 100));
    const passed = percentage >= EYE_CONTACT_PASS_PERCENTAGE && lookAwayCountRef.current < 4;

    setTimeout(() => {
      onComplete({
        accuracy: percentage,
        completionTime: EYE_CONTACT_DURATION,
        avgDeviationPx: lookAwayCountRef.current,
        offPathCount: lookAwayCountRef.current,
        passed,
      });
    }, 1200);
  };

  // INTRO PHASE
  if (stepState === 'intro') {
    return (
      <PageTransition>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-lg mx-auto text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl relative"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #14B8A6)' }}
          >
            <Eye className="w-12 h-12 text-white" />
            <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-blue-600 rounded-full text-[11px] font-black text-white border border-blue-400 uppercase tracking-widest shadow-md">
              15 SEC
            </div>
          </motion.div>

          <div>
            <span className="text-xs font-extrabold text-blue-400 uppercase tracking-widest">Phase 1: Gaze Stability</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">15-Second Eye Contact</h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-sm mx-auto mt-2 leading-relaxed">
              Look directly up at your device's camera lens. Google Gemini 1.5 Flash Vision AI analyzes your webcam snapshots in real-time.
            </p>
          </div>

          <div className="w-full glass-card p-5 rounded-2xl border border-slate-700/60 text-left space-y-3 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <span>Powered by <strong>Google Gemini 1.5 Flash Vision AI</strong>.</span>
            </div>
            <div className="flex items-center gap-3">
              <ArrowUp className="w-5 h-5 text-teal-400 flex-shrink-0 animate-bounce" />
              <span>Focus eyes directly on top <strong>Camera Lens 📷</strong>.</span>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>Looking off-screen or turning away registers a look-away penalty.</span>
            </div>
          </div>

          {/* Large Square Action Card / Button */}
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(59,130,246,0.6)' }}
            whileTap={{ scale: 0.97 }}
            onClick={startTest}
            className="w-full aspect-[4/3] sm:aspect-[16/9] min-h-[160px] p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-black text-xl sm:text-2xl cursor-pointer text-center flex flex-col items-center justify-center gap-3 shadow-2xl transition-all border border-blue-400/40"
          >
            <Camera className="w-10 h-10 text-white" />
            <span>Begin Eye Contact Test</span>
            <span className="text-xs font-semibold text-white/80">Tap to activate camera & Gemini AI Vision check</span>
          </motion.button>
        </div>
      </PageTransition>
    );
  }

  // COMPLETE PHASE
  if (stepState === 'complete') {
    const contactPct = Math.min(100, Math.round((eyeContactTime / EYE_CONTACT_DURATION) * 100));
    const passed = contactPct >= EYE_CONTACT_PASS_PERCENTAGE && lookAwayCount < 4;

    return (
      <PageTransition>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 rounded-3xl border border-slate-700/60 shadow-2xl w-full space-y-5"
          >
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
              {passed ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
            </div>

            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                {passed ? 'TEST PASSED' : 'LOOK AWAY DETECTED — FAILED'}
              </span>
              <h3 className="text-2xl font-extrabold text-white">15s Gaze Summary</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-xs text-slate-400">Eye Contact Ratio</p>
                <p className={`text-xl font-extrabold mt-0.5 ${contactPct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {contactPct}%
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-xs text-slate-400">Look-Aways</p>
                <p className={`text-xl font-extrabold mt-0.5 ${lookAwayCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {lookAwayCount} times
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400">Advancing to next phase...</p>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // ACTIVE 15-SECOND TEST PHASE
  const contactPct = Math.min(100, Math.round((eyeContactTime / EYE_CONTACT_DURATION) * 100));

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between px-4 py-4 max-w-md mx-auto space-y-4">
      {/* Hidden Canvas for Frame Snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top HUD Stats & Gemini Badge */}
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
                className={isLookingAway ? 'text-rose-500' : 'text-teal-400'}
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
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Gemini Vision AI</span>
            </div>
            <p className="text-sm font-extrabold text-white">{timeLeft}s remaining</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Gaze Score</p>
          <span className={`text-base font-extrabold ${contactPct >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {contactPct}% ({lookAwayCount} look-aways)
          </span>
        </div>
      </div>

      {/* Main Eye-Tracking Viewfinder Container */}
      <div
        className={`w-full relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-2xl flex flex-col items-center justify-between p-4 ${
          isLookingAway
            ? 'border-rose-500 bg-rose-950/40 glow-red'
            : 'border-emerald-500 bg-slate-950/80 glow-green'
        }`}
      >
        {/* Real Video Stream if camera available */}
        {hasWebcam ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center opacity-60">
            <div className="w-full h-full bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          </div>
        )}

        {/* TOP CAMERA LENS GUIDANCE: Animated Up Arrows ⬆️ ⬆️ ⬆️ */}
        <div className="relative z-20 w-full flex flex-col items-center justify-center pt-2">
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-teal-500/50 backdrop-blur-md shadow-2xl"
          >
            <ArrowUp className="w-6 h-6 text-teal-400 font-extrabold animate-bounce" />
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              LOOK UP AT CAMERA LENS 📷 ⬆️
            </span>
            <ArrowUp className="w-6 h-6 text-teal-400 font-extrabold animate-bounce" />
          </motion.div>
        </div>

        {/* Gemini Real-Time AI Status Banner */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full">
          <motion.div
            animate={{
              scale: isLookingAway ? [1, 1.15, 1] : [1, 1.05, 1],
            }}
            transition={{ duration: isLookingAway ? 0.4 : 2, repeat: Infinity }}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex flex-col items-center justify-center relative backdrop-blur-sm transition-colors duration-300 ${
              isLookingAway
                ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-red-500/50 shadow-2xl'
                : 'border-teal-400 bg-teal-500/10 text-teal-300 shadow-teal-500/50 shadow-2xl'
            }`}
          >
            <ArrowUp className="w-10 h-10 text-teal-400 mb-1" />
            <span className="text-[10px] font-black tracking-widest text-white uppercase">LOOK UP</span>
          </motion.div>

          {/* Gemini AI Feedback Banner */}
          <div className="mt-3 px-4 py-1.5 rounded-full backdrop-blur-md border text-xs sm:text-sm font-extrabold tracking-wide shadow-lg transition-all flex items-center gap-2 max-w-xs text-center justify-center">
            {geminiStatus ? (
              geminiStatus.lookingAtCamera ? (
                <span className="bg-emerald-500/20 border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Gemini AI: Eye Contact Confirmed ✨
                </span>
              ) : (
                <span className="bg-rose-500/20 border-rose-500/40 text-rose-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-rose-400 animate-bounce" />
                  Gemini AI: Looking Away ({geminiStatus.reason || 'Off-camera'})
                </span>
              )
            ) : isAnalyzingGemini ? (
              <span className="bg-blue-500/20 border-blue-500/40 text-blue-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                Analyzing frame with Gemini AI...
              </span>
            ) : isLookingAway ? (
              <span className="bg-rose-500/20 border-rose-500/40 text-rose-300 px-4 py-1.5 rounded-full flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-rose-400 animate-bounce" />
                ⚠️ LOOKING AWAY FROM CAMERA!
              </span>
            ) : (
              <span className="bg-emerald-500/20 border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-full flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                👀 GAZE CENTERED ON LENS
              </span>
            )}
          </div>
        </div>

        {webcamError && (
          <div className="absolute top-3 left-3 right-3 p-2 bg-slate-900/90 text-slate-300 rounded-xl text-[11px] text-center border border-slate-700 z-30">
            {webcamError}
          </div>
        )}
      </div>

      {/* Interactive Simulation & Manual Look-Away Controls with Large Area */}
      <div className="w-full glass-card p-4 sm:p-5 rounded-2xl border border-slate-700/60 flex flex-col items-center space-y-2">
        <p className="text-xs font-semibold text-slate-400">Test Control & Look-Away Simulation</p>
        <div className="flex gap-2 w-full">
          <button
            onMouseDown={() => handleLookAwayToggle(true)}
            onMouseUp={() => handleLookAwayToggle(false)}
            onTouchStart={() => handleLookAwayToggle(true)}
            onTouchEnd={() => handleLookAwayToggle(false)}
            className={`flex-1 py-4 sm:py-5 px-4 rounded-xl border text-sm sm:text-base font-extrabold flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
              isLookingAway
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <EyeOff className="w-5 h-5 text-rose-400" />
            <span>Hold to Simulate Looking Away</span>
          </button>
        </div>
      </div>
    </div>
  );
}
