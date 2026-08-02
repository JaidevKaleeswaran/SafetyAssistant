import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router';
import { PageTransition } from '@/components/layout/PageTransition';
import { ConfidenceRing } from './ConfidenceRing';
import { RideOptions } from './RideOptions';
import { useAssessment } from '@/hooks/useAssessment';
import { ShieldCheck, AlertTriangle, AlertOctagon, RotateCcw } from 'lucide-react';

const verdictConfig = {
  sober: {
    title: 'PASSED (80%+)',
    subtitle: 'No Impairment Detected',
    badgeText: 'SOBER — PASSED',
    color: '#10B981',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    icon: ShieldCheck,
    bgGlow: 'rgba(16, 185, 129, 0.12)',
  },
  mildlyImpaired: {
    title: 'FAILED (<80%)',
    subtitle: 'Mild Deviations / Distraction Detected',
    badgeText: 'MILDLY IMPAIRED — FAILED',
    color: '#F59E0B',
    bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    icon: AlertTriangle,
    bgGlow: 'rgba(245, 158, 11, 0.12)',
  },
  severelyImpaired: {
    title: 'FAILED (<80%)',
    subtitle: 'Significant Impairment Detected',
    badgeText: 'SEVERELY IMPAIRED — FAILED',
    color: '#EF4444',
    bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    icon: AlertOctagon,
    bgGlow: 'rgba(239, 68, 68, 0.12)',
  },
};

export function ResultsPage() {
  const { state, dispatch } = useAssessment();
  const navigate = useNavigate();
  const result = state.finalResult;

  if (!result) {
    return <Navigate to="/" replace />;
  }

  const config = verdictConfig[result.verdict];
  const Icon = config.icon;
  const isImpaired = result.verdict !== 'sober';

  const handleDone = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  return (
    <PageTransition>
      <div className="min-h-dvh bg-gradient-mesh flex flex-col justify-between items-center px-4 py-6 relative w-full overflow-y-auto">
        {/* Glow background */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full blur-3xl pointer-events-none"
          style={{ background: config.bgGlow }}
        />

        {/* Sleek Mobile Phone Container Width */}
        <div className="w-full max-w-md sm:max-w-xl mx-auto flex-1 flex flex-col justify-between space-y-4 relative z-10 py-2">
          {/* Top: Main Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden flex-shrink-0"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Left Column: Status Badge & Text */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 flex-1">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs sm:text-sm font-extrabold tracking-wider ${config.bgColor}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{config.badgeText}</span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {config.title}
                  </h1>
                  <p className="text-sm sm:text-base font-semibold text-slate-400 mt-1">
                    {config.subtitle} • Passing Score: <strong className="text-white font-extrabold">80%+</strong>
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed mt-1 w-full">
                  {result.summary}
                </div>
              </div>

              {/* Right Column: % Sober Score Ring */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center p-2">
                <ConfidenceRing value={result.weightedScore} color={config.color} size={145} strokeWidth={10} label="% Sober" />
              </div>
            </div>
          </motion.div>

          {/* Middle: Performance Breakdown Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-700/60 shadow-xl space-y-4 flex-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-200 uppercase tracking-wider">
                Weighted Performance Breakdown
              </h2>
              <span className="text-xs sm:text-sm font-bold text-slate-400">
                Score: <strong className="text-white text-sm sm:text-base font-black">{result.weightedScore}%</strong> (Target $\ge$ 80%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 flex-1">
              {[
                { label: 'Moving Target Tracking', score: result.testScores.drawing ?? result.testScores.eyeContact ?? 85, emoji: '🎯', weight: '25%', desc: 'Smooth pursuit target tracking accuracy' },
                { label: 'Emoji Recall', score: result.testScores.emojiMemory, emoji: '🧠', weight: '25%', desc: 'Visual memory accuracy' },
                { label: 'Visual Pattern', score: result.testScores.gridMemory, emoji: '🔲', weight: '15%', desc: 'Spatial grid awareness' },
                { label: 'Voice & Slurring', score: result.testScores.voice, emoji: '🎙️', weight: '15%', desc: 'ElevenLabs AI speech clarity & slurring' },
                { label: 'Signal Light Test', score: result.testScores.signalLight, emoji: '🚦', weight: '20%', desc: 'Voice-guided signal reaction speed' },
              ].map((item) => (
                <div key={item.label} className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex flex-col justify-between space-y-3 shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 text-xl flex items-center justify-center">
                        {item.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm sm:text-base font-extrabold text-white">{item.label}</p>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {item.weight}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-black tabular-nums" style={{
                      color: item.score >= 80 ? '#10B981' : item.score >= 50 ? '#F59E0B' : '#EF4444',
                    }}>
                      {item.score}%
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full overflow-hidden bg-slate-800/80">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      style={{
                        background: item.score >= 80 ? '#10B981' : item.score >= 50 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Lower-Middle: Alternative Transportation */}
          {isImpaired && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-700/60 shadow-xl flex-shrink-0"
            >
              <RideOptions />
            </motion.div>
          )}

          {/* Bottom: Primary CTA & Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center space-y-3 pt-2 pb-2 flex-shrink-0"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDone}
              className="w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-2xl cursor-pointer transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              Start New Assessment
            </motion.button>

            <p className="text-xs text-slate-500 max-w-sm text-center leading-relaxed">
              SafetyBuddy measures relative cognitive, visual focus, and articulation slurring performance deviations. Passing threshold is 80%+. It does not estimate BAC or provide legal advice.
            </p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
