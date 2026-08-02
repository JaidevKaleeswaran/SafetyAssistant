import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { Mic, CheckCircle, AlertTriangle, Sparkles, Shuffle, RefreshCw } from 'lucide-react';
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

  return (
    <PageTransition>
      <div className="w-full flex-1 flex flex-col justify-center items-center text-center px-4 py-4 max-w-md sm:max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-1.5 flex flex-col items-center justify-center pt-1">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Phase 4: Repetition & Slurring Analysis
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Voice & Articulation Test</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed pt-0.5">
            Read the tongue twister aloud while recording. We evaluate speech clarity and slurring.
          </p>
        </div>

        {/* ElevenLabs API Active Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-extrabold text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ElevenLabs STT Speech AI Engine Active</span>
        </div>

        {/* Selected Tongue Twister Card */}
        <div className="w-full glass-card p-5 sm:p-6 rounded-3xl border border-slate-700/80 shadow-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>{selectedTwister.emoji}</span>
              <span>{selectedTwister.title}</span>
            </span>

            <button
              onClick={handlePickNewTwister}
              disabled={isListening}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              title="Get a different tongue twister"
            >
              <Shuffle className="w-3 h-3 text-teal-400" />
              <span>New Phrase</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
            <p className="text-base sm:text-lg font-black text-white leading-snug tracking-tight">
              "{selectedTwister.phrase}"
            </p>
          </div>
        </div>

        {/* Action Controls Card */}
        <div className="w-full glass-card p-5 rounded-3xl border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center space-y-4">
          {/* Record Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={isListening ? stopRecording : startRecording}
            className={`w-full min-h-[90px] py-5 px-6 rounded-2xl text-white font-bold text-base sm:text-lg flex items-center justify-center gap-4 transition-all cursor-pointer shadow-xl text-center ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                : 'bg-gradient-to-r from-blue-600 via-teal-600 to-blue-500 hover:from-blue-500 hover:to-teal-400'
            }`}
          >
            <Mic className={`w-9 h-9 ${isListening ? 'animate-bounce text-white' : 'text-white'}`} />
            <div className="flex flex-col text-left">
              <span className="font-black text-xl">{isListening ? 'Stop Recording' : 'Tap to Record Speech'}</span>
              <span className="text-xs sm:text-sm text-white/80 font-normal">
                {isListening ? 'Listening & analyzing slurring...' : 'Speak the phrase out loud'}
              </span>
            </div>
          </motion.button>

          {/* ElevenLabs STT Processing Spinner */}
          {isAnalyzingSTT && (
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 animate-pulse py-1">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Analyzing Speech via ElevenLabs STT AI...</span>
            </div>
          )}

          {/* Transcribed Output & Slurring Badge */}
          {transcript && (
            <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2.5 shadow-inner">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-slate-400">Speech Transcribed:</span>
                {analysis && (
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      analysis.accuracy >= 80
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {analysis.accuracy}% Word Match
                  </span>
                )}
              </div>

              <p className="text-sm sm:text-base font-bold text-white italic">
                "{transcript}"
              </p>

              {/* Slurring Status Indicator */}
              {analysis && (
                <div
                  className={`mt-2 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                    analysis.slurringDetected
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {analysis.slurringDetected ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                    <span>
                      {analysis.slurringDetected
                        ? '⚠️ Speech Slurring / Word Omission Detected'
                        : 'Speech Articulation: Crisp & Clear'}
                    </span>
                  </div>
                  <span>Clarity: {analysis.slurScore}%</span>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 35px rgba(16,185,129,0.5)' }}
            whileTap={{ scale: 0.96 }}
            onClick={handleFinishTest}
            className="w-full min-h-[76px] sm:min-h-[84px] py-5 sm:py-6 px-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 cursor-pointer shadow-2xl transition-all border border-emerald-400/30"
          >
            <CheckCircle className="w-8 h-8 text-white flex-shrink-0" />
            <span>Submit Voice Test</span>
          </motion.button>
        </div>
      </div>
    </PageTransition>
  );
}
