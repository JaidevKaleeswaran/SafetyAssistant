import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { AutoStartTimerBar } from '@/components/shared/AutoStartTimerBar';
import { Mic, CheckCircle2, RefreshCw, Shuffle } from 'lucide-react';
import { ELEVENLABS_API_KEY, TONGUE_TWISTERS } from '@/lib/constants';
import type { VoiceTestResult } from '@/types/assessment';

interface VoiceTestProps {
  onComplete: (result: VoiceTestResult) => void;
}

/** Compute speech accuracy and analyze speech slurring / articulation clarity */
function analyzeSpeechArticulation(target: string, spoken: string, speechDurationSeconds: number): {
  accuracy: number;
  slurringDetected: boolean;
  slurScore: number;
  articulationClarity: number;
} {
  if (!spoken || spoken.trim().length === 0) {
    return { accuracy: 0, slurringDetected: true, slurScore: 0, articulationClarity: 0 };
  }

  const cleanTarget = target.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  if (cleanTarget.length === 0) {
    return { accuracy: 0, slurringDetected: true, slurScore: 0, articulationClarity: 0 };
  }

  let matches = 0;
  const spokenSet = new Set(cleanSpoken);

  for (const word of cleanTarget) {
    if (spokenSet.has(word)) {
      matches++;
    }
  }

  const wordAccuracy = (matches / cleanTarget.length) * 100;
  const lengthRatio = Math.min(1, cleanSpoken.length / cleanTarget.length);
  const accuracy = Math.round(wordAccuracy * lengthRatio);

  const expectedMinSeconds = 2.0;
  const expectedMaxSeconds = 6.0;

  let slurPenalty = 0;

  if (speechDurationSeconds > expectedMaxSeconds) {
    slurPenalty += Math.min(40, (speechDurationSeconds - expectedMaxSeconds) * 10);
  } else if (speechDurationSeconds < expectedMinSeconds && cleanSpoken.length < cleanTarget.length) {
    slurPenalty += 20;
  }

  const missingWordsCount = cleanTarget.length - matches;
  slurPenalty += missingWordsCount * 12;

  const slurScore = Math.max(0, Math.min(100, Math.round(100 - slurPenalty)));
  const slurringDetected = slurScore < 70 || missingWordsCount >= 3;
  const articulationClarity = Math.round(accuracy * 0.5 + slurScore * 0.5);

  return {
    accuracy,
    slurringDetected,
    slurScore,
    articulationClarity,
  };
}

export function VoiceTest({ onComplete }: VoiceTestProps) {
  // Pick random tongue twister on mount
  const [selectedTwisterIndex, setSelectedTwisterIndex] = useState<number>(() =>
    Math.floor(Math.random() * TONGUE_TWISTERS.length)
  );
  const selectedTwister = TONGUE_TWISTERS[selectedTwisterIndex];

  const [phase, setPhase] = useState<'intro' | 'active'>('intro');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingSTT, setIsAnalyzingSTT] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<{
    accuracy: number;
    slurringDetected: boolean;
    slurScore: number;
    articulationClarity: number;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(Date.now());
  const recordingStartTimeRef = useRef<number>(Date.now());
  const shouldBeListeningRef = useRef(false);

  const handlePickNewTwister = () => {
    let nextIdx = Math.floor(Math.random() * TONGUE_TWISTERS.length);
    if (nextIdx === selectedTwisterIndex) {
      nextIdx = (selectedTwisterIndex + 1) % TONGUE_TWISTERS.length;
    }
    setSelectedTwisterIndex(nextIdx);
    setTranscript('');
    setAnalysis(null);
  };

  // Convert audio blob to text via ElevenLabs STT Speech-to-Text API
  const processElevenLabsSTT = async (audioBlob: Blob): Promise<string | null> => {
    if (!ELEVENLABS_API_KEY) return null;

    try {
      setIsAnalyzingSTT(true);
      const formData = new FormData();
      formData.append('file', audioBlob, 'speech.wav');
      formData.append('model_id', 'scribe_v1');

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          return data.text.trim();
        }
      }
    } catch (e) {
      console.warn('ElevenLabs STT API error, using browser STT fallback:', e);
    } finally {
      setIsAnalyzingSTT(false);
    }
    return null;
  };

  // Microphone Recording & Speech Recognition Setup
  const startRecording = async () => {
    setTranscript('');
    setAnalysis(null);
    shouldBeListeningRef.current = true;
    setIsListening(true);
    recordingStartTimeRef.current = Date.now();

    // 1. Setup MediaRecorder for ElevenLabs STT API
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.warn('Microphone stream access error:', e);
    }

    // 2. Setup Web Speech API fallback for live transcript
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (err) {}
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          const trimmed = currentTranscript.trim();
          if (trimmed) {
            setTranscript(trimmed);
            const durationSec = (Date.now() - recordingStartTimeRef.current) / 1000;
            const res = analyzeSpeechArticulation(selectedTwister.phrase, trimmed, durationSec);
            setAnalysis(res);
          }
        };

        recognition.onend = () => {
          if (shouldBeListeningRef.current) {
            try { recognition.start(); } catch (err) {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition start failed:', err);
      }
    }
  };

  const stopRecording = async () => {
    shouldBeListeningRef.current = false;
    setIsListening(false);

    // Stop SpeechRecognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (err) {}
    }

    const durationSec = (Date.now() - recordingStartTimeRef.current) / 1000;

    // Stop MediaRecorder and send to ElevenLabs STT API
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const elevenLabsText = await processElevenLabsSTT(audioBlob);

        const finalText = elevenLabsText || transcript;
        if (finalText) {
          setTranscript(finalText);
          const res = analyzeSpeechArticulation(selectedTwister.phrase, finalText, durationSec);
          setAnalysis(res);
        }

        // Stop all tracks
        mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.stop();
    } else if (transcript) {
      const res = analyzeSpeechArticulation(selectedTwister.phrase, transcript, durationSec);
      setAnalysis(res);
    }
  };

  const handleFinishTest = () => {
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const speechDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
    const finalAnalysis = analysis || analyzeSpeechArticulation(selectedTwister.phrase, transcript, speechDuration);

    onComplete({
      completed: true,
      duration,
      accuracy: finalAnalysis.accuracy,
      userSpeech: transcript || '(No speech detected)',
      slurringDetected: finalAnalysis.slurringDetected,
      slurScore: finalAnalysis.slurScore,
      articulationClarity: finalAnalysis.articulationClarity,
    });
  };

  if (phase === 'intro') {
    return (
      <PageTransition>
        <div className="w-full flex-1 flex flex-col items-center justify-between text-center px-6 py-6 sm:py-10 max-w-md sm:max-w-lg mx-auto min-h-[480px] sm:min-h-[520px]">
          {/* 7-Second Auto-Start Progress Bar */}
          <AutoStartTimerBar duration={7} onAutoStart={() => setPhase('active')} />

          {/* Top: Title & Subtitle */}
          <div className="space-y-3 pt-2">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Voice Articulation
            </h1>
            <p className="text-base sm:text-lg text-slate-200 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Read the phrase aloud while recording to test your speech clarity
            </p>
          </div>

          {/* Center Hero Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-[36px] bg-gradient-to-br from-blue-950/80 via-slate-900 to-teal-950/80 border-2 border-blue-400/80 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.35)] relative overflow-hidden my-4"
          >
            <div className="absolute inset-2 rounded-[28px] border border-blue-400/30 pointer-events-none" />
            <Mic className="w-24 h-24 sm:w-28 sm:h-28 text-blue-300 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
          </motion.div>

          {/* Bottom Pill Button */}
          <motion.button
            whileHover={{ scale: 1.06, boxShadow: '0 0 50px rgba(59,130,246,0.8)' }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setPhase('active')}
            className="w-full sm:w-auto min-w-[280px] sm:min-w-[340px] py-6 sm:py-7 px-16 sm:px-24 min-h-[80px] sm:min-h-[88px] rounded-full bg-blue-400 hover:bg-blue-300 text-slate-950 font-black text-2xl sm:text-3xl cursor-pointer shadow-2xl transition-all border-2 border-blue-200/50"
          >
            Begin Test
          </motion.button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-lg sm:max-w-xl mx-auto">
        {/* Outer Card matching screenshot scale */}
        <div className="w-full glass-card p-8 sm:p-10 rounded-[40px] border border-slate-700/80 shadow-2xl flex flex-col items-center justify-between text-center min-h-[540px] sm:min-h-[580px] space-y-6 relative overflow-hidden">
          
          {/* Header */}
          <div className="space-y-2.5 text-center pt-2">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">Voice Test</h2>
            <p className="text-base sm:text-lg text-slate-300 leading-normal max-w-md mx-auto">
              Read the phrase aloud and record your voice
            </p>
          </div>

          {/* Large Phrase Card with White Border */}
          <div className="w-full min-h-[200px] sm:min-h-[240px] p-8 sm:p-10 rounded-3xl border-2 border-white/80 bg-slate-950/80 shadow-2xl flex flex-col items-center justify-center text-center relative my-2">
            <button
              onClick={handlePickNewTwister}
              disabled={isListening}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              title="Change phrase"
            >
              <Shuffle className="w-4 h-4 text-blue-400" />
            </button>
            <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed max-w-md mx-auto">
              "{selectedTwister.phrase}"
            </p>
          </div>

          {/* ElevenLabs Processing Indicator */}
          {isAnalyzingSTT && (
            <div className="flex items-center gap-2 text-sm font-bold text-blue-400 animate-pulse py-1">
              <RefreshCw className="w-4.5 h-4.5 animate-spin text-blue-400" />
              <span>Analyzing Speech via ElevenLabs STT AI...</span>
            </div>
          )}

          {/* Transcribed text if recorded */}
          {transcript && (
            <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1.5 shadow-inner">
              <span className="text-xs font-semibold text-slate-400">Transcribed Speech:</span>
              <p className="text-base font-bold text-white italic">"{transcript}"</p>
            </div>
          )}

          {/* Action Buttons Row - Large Squared Cards */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 w-full pt-2">
            {/* Start / Stop Recording Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59,130,246,0.6)' }}
              whileTap={{ scale: 0.95 }}
              onClick={isListening ? stopRecording : startRecording}
              className={`flex-1 py-6 sm:py-7 px-4 rounded-3xl text-white font-black text-base sm:text-lg flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[105px] sm:min-h-[115px] shadow-2xl transition-all border ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 animate-pulse border-rose-400/50'
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-400/30'
              }`}
            >
              <Mic className="w-8 h-8 text-white flex-shrink-0" />
              <span>{isListening ? 'Stop Recording' : 'Start Recording'}</span>
            </motion.button>

            {/* Submit Test Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(16,185,129,0.6)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinishTest}
              className="flex-1 py-6 sm:py-7 px-4 rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base sm:text-lg flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[105px] sm:min-h-[115px] shadow-2xl transition-all border border-emerald-300/40"
            >
              <CheckCircle2 className="w-8 h-8 text-slate-950 flex-shrink-0" />
              <span>Submit Test</span>
            </motion.button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
