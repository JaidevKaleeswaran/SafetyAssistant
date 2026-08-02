import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { FastForward } from 'lucide-react';
import { useAssessment } from '@/hooks/useAssessment';
import { calculateAssessment } from '@/lib/scoring';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { DrawingTest } from './DrawingTest';
import { EmojiMemoryTest } from './EmojiMemoryTest';
import { GridMemoryTest } from './GridMemoryTest';
import { VoiceTest } from './VoiceTest';
import { SignalLightTest } from './SignalLightTest';
import type {
  DrawingTestResult,
  EmojiMemoryResult,
  GridMemoryResult,
  VoiceTestResult,
  SignalLightResult,
} from '@/types/assessment';

export function AssessmentFlow() {
  const { state, dispatch } = useAssessment();
  const navigate = useNavigate();

  const handleDrawingComplete = (result: DrawingTestResult) => {
    dispatch({ type: 'SET_DRAWING', payload: result });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleEmojiComplete = (result: EmojiMemoryResult) => {
    dispatch({ type: 'SET_EMOJI', payload: result });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleGridComplete = (result: GridMemoryResult) => {
    dispatch({ type: 'SET_GRID', payload: result });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleVoiceComplete = (result: VoiceTestResult) => {
    dispatch({ type: 'SET_VOICE', payload: result });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleSignalLightComplete = (result: SignalLightResult) => {
    dispatch({ type: 'SET_SIGNAL_LIGHT', payload: result });

    // Calculate final result with all 5 test scores
    const drawing: DrawingTestResult = state.drawingResult || state.eyeContactResult || {
      accuracy: 85,
      completionTime: 8,
      avgDeviationPx: 4,
      offPathCount: 1,
      passed: true,
    };
    const emoji: EmojiMemoryResult = state.emojiResult || {
      accuracy: 0,
      timeTaken: 10,
      mistakes: 3,
      rounds: [],
    };
    const grid: GridMemoryResult = state.gridResult || {
      accuracy: 0,
      completionTime: 10,
      mistakes: 3,
      rounds: [],
    };
    const voice: VoiceTestResult = state.voiceResult || {
      completed: true,
      duration: 5,
      accuracy: 80,
      userSpeech: '',
      slurringDetected: false,
      slurScore: 80,
    };

    const finalResult = calculateAssessment(drawing, emoji, grid, voice, result);
    dispatch({ type: 'SET_FINAL', payload: finalResult });

    navigate('/results');
  };

  const handleSkipPhase = () => {
    switch (state.currentStep) {
      case 0:
        handleDrawingComplete({
          accuracy: 0,
          completionTime: 10,
          avgDeviationPx: 50,
          offPathCount: 10,
          passed: false,
        });
        break;
      case 1:
        handleEmojiComplete({
          accuracy: 0,
          timeTaken: 10,
          mistakes: 3,
          rounds: [],
        });
        break;
      case 2:
        handleGridComplete({
          accuracy: 0,
          completionTime: 10,
          mistakes: 3,
          rounds: [],
        });
        break;
      case 3:
        handleVoiceComplete({
          completed: true,
          duration: 0,
          accuracy: 0,
          userSpeech: '(Skipped test)',
          slurringDetected: true,
          slurScore: 0,
        });
        break;
      case 4:
        handleSignalLightComplete({
          accuracy: 0,
          avgReactionTime: 2000,
          rounds: [],
          wrongTaps: 5,
        });
        break;
    }
  };

  const renderCurrentTest = () => {
    switch (state.currentStep) {
      case 0:
        return <DrawingTest key="drawing" onComplete={handleDrawingComplete} />;
      case 1:
        return <EmojiMemoryTest key="emoji" onComplete={handleEmojiComplete} />;
      case 2:
        return <GridMemoryTest key="grid" onComplete={handleGridComplete} />;
      case 3:
        return <VoiceTest key="voice" onComplete={handleVoiceComplete} />;
      case 4:
        return <SignalLightTest key="signalLight" onComplete={handleSignalLightComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-mesh flex flex-col justify-between items-center w-full relative">
      {/* Skip Phase Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleSkipPhase}
          className="px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700/60 shadow-md backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer hover:text-white"
        >
          <span>Skip Phase</span>
          <FastForward className="w-3.5 h-3.5 text-blue-400" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl sm:max-w-2xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {renderCurrentTest()}
        </AnimatePresence>
      </div>
      <div className="w-full pb-8 pt-4 flex justify-center items-center">
        <ProgressBar currentStep={state.currentStep} />
      </div>
    </div>
  );
}
