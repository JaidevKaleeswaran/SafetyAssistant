import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router';
import { PageTransition } from '@/components/layout/PageTransition';
import { ConfidenceRing } from './ConfidenceRing';
import { RideOptions } from './RideOptions';
import { useAssessment } from '@/hooks/useAssessment';
import { Brain, ShieldAlert, Car, Sparkles, Mic, Target, RotateCcw } from 'lucide-react';

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
                  label="SOBER"
                />
              </div>

              {/* Right: 3 Bullet Point Indicators */}
              <div className="flex flex-col space-y-3 flex-1 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${isImpaired ? 'bg-rose-950/80 border border-rose-800/80 text-rose-400' : 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-400'}`}>
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300 font-medium leading-tight">
                    {isImpaired ? 'Multiple cognitive indicators deviated from baseline' : 'Cognitive indicators aligned with normal baseline'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${isImpaired ? 'bg-rose-950/80 border border-rose-800/80 text-rose-400' : 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-400'}`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300 font-medium leading-tight">
                    {isImpaired ? 'For your safety and the safety of others' : 'You are safe to drive — stay alert'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${isImpaired ? 'bg-rose-950/80 border border-rose-800/80 text-rose-400' : 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-400'}`}>
                    <Car className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300 font-medium leading-tight">
                    {isImpaired ? 'Choose a safe alternative transportation' : 'Drive responsibly and obey traffic laws'}
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
            <h2 className="text-base font-black text-white">Performance Summary</h2>

            <div className="space-y-3 pt-1">
              {[
                {
                  label: 'Moving Target Tracking',
                  score: result.testScores.drawing ?? 0,
                  icon: <Target className="w-4 h-4" />,
                  iconBg: 'bg-blue-500/20 text-blue-400',
                  passText: 'Smooth pursuit control',
                  failText: 'Reduced tracking precision',
                },
                {
                  label: 'Emoji Memory Recall',
                  score: result.testScores.emojiMemory ?? 0,
                  icon: <span className="text-sm">🧠</span>,
                  iconBg: 'bg-indigo-500/20 text-indigo-400',
                  passText: 'High recall precision',
                  failText: 'Reduced recall accuracy',
                },
                {
                  label: 'Visual Pattern Memory',
                  score: result.testScores.gridMemory ?? 0,
                  icon: <span className="text-sm">🔲</span>,
                  iconBg: 'bg-violet-500/20 text-violet-400',
                  passText: 'Strong spatial awareness',
                  failText: 'Reduced pattern memory',
                },
                {
                  label: 'Voice & Articulation',
                  score: result.testScores.voice ?? 0,
                  icon: <Mic className="w-4 h-4" />,
                  iconBg: 'bg-teal-500/20 text-teal-400',
                  passText: 'Clear speech articulation',
                  failText: 'Hesitation or slurring detected',
                },
                {
                  label: 'Signal Light Reaction',
                  score: result.testScores.signalLight ?? 0,
                  icon: <span className="text-sm">🚦</span>,
                  iconBg: 'bg-emerald-500/20 text-emerald-400',
                  passText: 'Fast & accurate response',
                  failText: 'Delayed or incorrect response',
                },
              ].map((item) => {
                const color = item.score >= 80 ? '#10B981' : item.score >= 50 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={item.label} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-white">{item.label}</p>
                          <p className="text-[11px] text-slate-400">
                            {item.score >= 80 ? item.passText : item.failText}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black tabular-nums" style={{ color }}>
                        {item.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ duration: 1, delay: 0.4 }}
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
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
