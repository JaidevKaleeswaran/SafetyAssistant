import { motion } from 'framer-motion';
import { Shield, Brain, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageTransition } from '@/components/layout/PageTransition';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-dvh bg-gradient-mesh flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + i * 2,
                height: 4 + i * 2,
                background: `rgba(59, 130, 246, ${0.1 + i * 0.03})`,
                left: `${15 + i * 15}%`,
                top: `${20 + i * 10}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Logo / Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center glow-blue" style={{ background: 'linear-gradient(135deg, #3B82F6, #14B8A6)' }}>
            <Shield className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #14B8A6)' }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="w-4 h-4 text-white" strokeWidth={2} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-5xl sm:text-6xl font-extrabold text-gradient mb-3 tracking-tight"
        >
          SafetyBuddy
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="text-lg sm:text-xl font-light mb-16 sm:mb-20 max-w-md text-center"
          style={{ color: '#94A3B8' }}
        >
          One minute. One assessment. One safe decision. Many lives saved.
        </motion.p>

        {/* Start Assessment Button — Wide Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(59,130,246,0.6)' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/assess')}
          className="group relative flex flex-col items-center justify-center gap-2.5 w-72 sm:w-96 h-44 sm:h-48 rounded-3xl text-white font-extrabold text-xl sm:text-2xl cursor-pointer text-center shadow-2xl transition-all p-5"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
        >
          <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-white transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2">
            <span>Start Assessment</span>
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:translate-x-1.5" />
          </div>
          <div className="absolute inset-0 rounded-3xl glow-blue opacity-60 pointer-events-none" />
        </motion.button>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex gap-4 sm:gap-6 mt-12 flex-wrap justify-center max-w-xl px-2"
        >
          {[
            { icon: '👀', label: '15s Eye Contact' },
            { icon: '⚖️', label: '30% / 30% / 20% / 20% Weights' },
            { icon: '🎯', label: '80%+ Passing Score' },
            { icon: '🎙️', label: 'ElevenLabs & Slurring Tracking' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-300">
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16 text-xs max-w-sm text-center leading-relaxed"
          style={{ color: '#475569' }}
        >
          SafetyBuddy does not estimate BAC and does not tell you whether it's legal for you to drive. Always use your own judgment.
        </motion.p>
      </div>
    </PageTransition>
  );
}
