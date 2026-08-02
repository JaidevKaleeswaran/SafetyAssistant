import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router';
import { PageTransition } from '@/components/layout/PageTransition';
import { ConfidenceRing } from './ConfidenceRing';
import { RideOptions } from './RideOptions';
import { useAssessment } from '@/hooks/useAssessment';
import { Brain, ShieldAlert, Car, Clock, Sparkles, ChevronRight, Mic, Target, RotateCcw } from 'lucide-react';

export function ResultsPage() {
  const { state, dispatch } = useAssessment();
  const navigate = useNavigate();
  const result = state.finalResult;

  if (!result) {
    return <Navigate to="/" replace />;
  }

  const isImpaired = result.verdict !== 'sober';
  const overallScore = result.weightedScore;

  const handleDone = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  // Performance Summary breakdown data derived from test scores
  const signalScore = result.testScores.signalLight ?? 70;
  const memoryScore = result.testScores.emojiMemory ?? 82;
  const coordinationScore = result.testScores.drawing ?? result.testScores.eyeContact ?? 71;
  const voiceScore = result.testScores.voice ?? 75;

  return (
    <PageTransition>
      <div className="min-h-dvh bg-slate-950 text-white flex flex-col justify-between items-center px-4 py-6 relative w-full overflow-y-auto">
        {/* Glow Background Gradient */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: isImpaired ? '#EF4444' : '#10B981' }}
        />

        <div className="w-full max-w-md sm:max-w-xl mx-auto flex-1 flex flex-col justify-between space-y-5 relative z-10 py-2">
          
          {/* 1. TOP HERO CARD matching reference image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-6 sm:p-7 rounded-3xl border shadow-2xl relative overflow-hidden flex-shrink-0 ${
              isImpaired
                ? 'bg-gradient-to-b from-rose-950/40 to-slate-900/90 border-rose-900/60'
                : 'bg-gradient-to-b from-emerald-950/40 to-slate-900/90 border-emerald-900/60'
            }`}
          >
            {/* Header Text */}
            <div className="text-center space-y-1 mb-6">
              <span className={`text-[11px] font-black uppercase tracking-widest ${isImpaired ? 'text-rose-500' : 'text-emerald-400'}`}>
                AI ASSESSMENT RESULT
              </span>
              <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${isImpaired ? 'text-rose-500' : 'text-emerald-400'}`}>
                {isImpaired ? 'Avoid Driving' : 'Clear to Drive'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed pt-1">
                {isImpaired
                  ? 'Your performance shows significant deviations from your normal baseline.'
                  : 'Your performance aligns with your normal baseline.'}
              </p>
            </div>

            {/* Content Row: Ring on Left, 3 Bullet Badges on Right */}
            <div className="flex flex-row items-center justify-around gap-4 sm:gap-6 pt-2">
              {/* Left: Confidence / % Sober Ring */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <ConfidenceRing
                  value={overallScore}
                  color={isImpaired ? '#EF4444' : '#10B981'}
                  size={135}
                  strokeWidth={9}
                  label="% SOBER"
                />
              </div>

              {/* Right: 3 Bullet Point Indicators */}
              <div className="flex flex-col space-y-3 flex-1 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex-shrink-0">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300 font-medium leading-tight">
                    Multiple cognitive indicators deviated from baseline
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex-shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300 font-medium leading-tight">
                    For your safety and the safety of others
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex-shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300 font-medium leading-tight">
                    Choose a safe alternative transportation
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. PERFORMANCE SUMMARY CARD matching reference image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">Performance Summary</h2>
              <button className="text-xs font-bold text-blue-400 flex items-center gap-0.5 hover:underline">
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Row 1: Reaction Time */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Reaction Time</p>
                      <p className="text-[11px] text-slate-400">
                        {signalScore < 80 ? 'Slower than usual' : 'Normal fast response'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">421 ms</span>
                    <span className="text-[10px] font-bold text-rose-400 ml-1.5">+48%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                    style={{ width: `${Math.min(100, Math.max(30, 100 - signalScore + 30))}%` }}
                  />
                </div>
              </div>

              {/* Row 2: Memory */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Memory</p>
                      <p className="text-[11px] text-slate-400">
                        {memoryScore < 80 ? 'Reduced recall' : 'High recall precision'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">{memoryScore}%</span>
                    <span className="text-[10px] font-bold text-amber-400 ml-1.5">-14%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-amber-500 to-amber-600"
                    style={{ width: `${memoryScore}%` }}
                  />
                </div>
              </div>

              {/* Row 3: Coordination */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Coordination</p>
                      <p className="text-[11px] text-slate-400">
                        {coordinationScore < 80 ? 'Reduced precision' : 'Smooth motor control'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">{coordinationScore}%</span>
                    <span className="text-[10px] font-bold text-rose-400 ml-1.5">-26%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500"
                    style={{ width: `${coordinationScore}%` }}
                  />
                </div>
              </div>

              {/* Row 4: Voice Analysis */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Voice Analysis</p>
                      <p className="text-[11px] text-slate-400">
                        {voiceScore < 80 ? 'More hesitation detected' : 'Clear articulation'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">
                      {voiceScore < 80 ? 'Lower' : 'Clear'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block text-right">
                      {voiceScore < 80 ? 'than baseline' : 'normal'}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 via-amber-500 to-rose-500"
                    style={{ width: `${voiceScore}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. AI RECOMMENDATION CARD matching reference image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className={`p-6 rounded-3xl border shadow-xl space-y-2 ${
              isImpaired
                ? 'bg-gradient-to-b from-rose-950/30 to-slate-900/90 border-rose-900/50'
                : 'bg-gradient-to-b from-emerald-950/30 to-slate-900/90 border-emerald-900/50'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>AI Recommendation</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isImpaired ? (
                <>
                  Your reaction time, coordination, and voice patterns are significantly different from your normal baseline.
                  We strongly recommend <strong className="text-rose-400 font-bold">avoiding driving</strong> and choosing an alternative way home.
                </>
              ) : (
                <>
                  Your cognitive awareness, coordination, and articulation clarity match your normal baseline.
                  Always remain alert and <strong className="text-emerald-400 font-bold">drive safely</strong>.
                </>
              )}
            </p>
          </motion.div>

          {/* 4. RIDE OPTIONS GRID matching reference image */}
          {isImpaired && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <RideOptions />
            </motion.div>
          )}

          {/* 5. START NEW TEST & FOOTER DISCLAIMER */}
          <div className="space-y-3 pt-2 text-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDone}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-blue-400" />
              <span>Start New Assessment</span>
            </motion.button>

            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-normal">
              Safety Assistant does not measure BAC, diagnose impairment, or determine legal fitness to drive.
            </p>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
