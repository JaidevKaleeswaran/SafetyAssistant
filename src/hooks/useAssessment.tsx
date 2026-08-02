import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  AssessmentState,
  DrawingTestResult,
  EyeContactTestResult,
  EmojiMemoryResult,
  GridMemoryResult,
  VoiceTestResult,
  SignalLightResult,
  AssessmentResult,
} from '@/types/assessment';

const initialState: AssessmentState = {
  currentStep: 0,
  drawingResult: null,
  eyeContactResult: null,
  emojiResult: null,
  gridResult: null,
  voiceResult: null,
  signalLightResult: null,
  finalResult: null,
};

type Action =
  | { type: 'SET_DRAWING'; payload: DrawingTestResult }
  | { type: 'SET_EYE_CONTACT'; payload: EyeContactTestResult }
  | { type: 'SET_EMOJI'; payload: EmojiMemoryResult }
  | { type: 'SET_GRID'; payload: GridMemoryResult }
  | { type: 'SET_VOICE'; payload: VoiceTestResult }
  | { type: 'SET_SIGNAL_LIGHT'; payload: SignalLightResult }
  | { type: 'SET_FINAL'; payload: AssessmentResult }
  | { type: 'NEXT_STEP' }
  | { type: 'RESET' };

function reducer(state: AssessmentState, action: Action): AssessmentState {
  switch (action.type) {
    case 'SET_DRAWING':
      return { ...state, drawingResult: action.payload };
    case 'SET_EYE_CONTACT':
      return { ...state, eyeContactResult: action.payload, drawingResult: action.payload };
    case 'SET_EMOJI':
      return { ...state, emojiResult: action.payload };
    case 'SET_GRID':
      return { ...state, gridResult: action.payload };
    case 'SET_VOICE':
      return { ...state, voiceResult: action.payload };
    case 'SET_SIGNAL_LIGHT':
      return { ...state, signalLightResult: action.payload };
    case 'SET_FINAL':
      return { ...state, finalResult: action.payload };
    case 'NEXT_STEP':
      return { ...state, currentStep: state.currentStep + 1 };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AssessmentContextType {
  state: AssessmentState;
  dispatch: React.Dispatch<Action>;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider');
  }
  return context;
}
