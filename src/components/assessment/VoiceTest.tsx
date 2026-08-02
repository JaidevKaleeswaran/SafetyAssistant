import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { Mic, Volume2, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } from '@/lib/constants';
import type { VoiceTestResult } from '@/types/assessment';

interface VoiceTestProps {
  onComplete: (result: VoiceTestResult) => void;
}

const TARGET_PHRASE = 'Peter Piper picked a peck of pickled peppers';

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

  // Slurring analysis based on syllable rate, timing, and word truncation
  // Target phrase has 15 syllables. Normal spoken time for 15 syllables is ~2.5 - 4.5 seconds.
  const expectedMinSeconds = 2.0;
  const expectedMaxSeconds = 5.5;

  let slurPenalty = 0;

  // Too slow / prolonged speech (slurring drag)
  if (speechDurationSeconds > expectedMaxSeconds) {
    slurPenalty += Math.min(40, (speechDurationSeconds - expectedMaxSeconds) * 12);
  } else if (speechDurationSeconds < expectedMinSeconds && cleanSpoken.length < cleanTarget.length) {
    // Too fast truncated speech
    slurPenalty += 25;
  }

  // Word match deficit penalty
  const missingWordsCount = cleanTarget.length - matches;
  slurPenalty += missingWordsCount * 15;

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
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<{
    accuracy: number;
    slurringDetected: boolean;
    slurScore: number;
    articulationClarity: number;
  } | null>(null);
  const [isElevenLabsActive, setIsElevenLabsActive] = useState(false);

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef(Date.now());
  const recordingStartTimeRef = useRef<number>(Date.now());
  const shouldBeListeningRef = useRef(false);

  // Play audio prompt using ElevenLabs API with Web Speech fallback
  const playAudioPrompt = async () => {
    setIsPlayingAudio(true);
    setIsElevenLabsActive(false);

    try {
      if (ELEVENLABS_API_KEY) {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text: TARGET_PHRASE,
              model_id: 'eleven_turbo_v2_5',
              voice_settings: {
                stability: 0.75,
                similarity_boost: 0.85,
              },
            }),
          }
        );

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          setIsElevenLabsActive(true);

          audio.onended = () => {
            setIsPlayingAudio(false);
            setIsElevenLabsActive(false);
          };
          audio.onerror = () => {
            fallbackSpeechSynthesis();
          };
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn('ElevenLabs API request failed, using browser TTS fallback:', e);
    }

    fallbackSpeechSynthesis();
  };

  const fallbackSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(TARGET_PHRASE);
      utterance.rate = 0.85;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  // Speech Recognition & Slurring Analysis
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    shouldBeListeningRef.current = true;
    setIsListening(true);
    recordingStartTimeRef.current = Date.now();

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser environment. Please use Google Chrome or Apple Safari.');
      setIsListening(false);
      shouldBeListeningRef.current = false;
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        const trimmed = currentTranscript.trim();
        if (trimmed) {
          setTranscript(trimmed);
          const speechDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
          const resultAnalysis = analyzeSpeechArticulation(TARGET_PHRASE, trimmed, speechDuration);
          setAnalysis(resultAnalysis);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
      };

      recognition.onend = () => {
        if (shouldBeListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition', e);
    }
  };

  const stopRecording = () => {
    shouldBeListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const handleFinishTest = () => {
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const speechDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
    const finalAnalysis = analysis || analyzeSpeechArticulation(TARGET_PHRASE, transcript, speechDuration);

    onComplete({
      completed: true,
      duration,
      accuracy: finalAnalysis.accuracy,
      userSpeech: transcript,
      slurringDetected: finalAnalysis.slurringDetected,
      slurScore: finalAnalysis.slurScore,
      articulationClarity: finalAnalysis.articulationClarity,
    });
  };

  return (
    <PageTransition>
      <div className="w-full flex-1 flex flex-col justify-center items-center text-center px-4 py-6 max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="text-center space-y-2 flex flex-col items-center justify-center pt-2">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Phase 4: Repetition & Slurring Analysis</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Voice & Articulation Test</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed pt-1">
            Listen to the AI spoken prompt, then repeat the phrase back. We track pronunciation precision and speech slurring.
          </p>
        </div>

        {/* ElevenLabs API Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-extrabold text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ElevenLabs HD Audio Engine Active</span>
        </div>

        {/* Main Buttons Card */}
        <div className="w-full max-w-sm sm:max-w-md glass-card p-6 sm:p-7 rounded-3xl border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center space-y-4">
          {/* Listen Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={playAudioPrompt}
            disabled={isPlayingAudio}
            className={`w-full h-28 sm:h-32 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-4 transition-all cursor-pointer shadow-xl p-5 text-center ${
              isPlayingAudio
                ? 'bg-blue-600/90 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
            }`}
          >
            <Volume2 className={`w-8 h-8 ${isPlayingAudio ? 'animate-bounce text-white' : 'text-blue-400'}`} />
            <div className="flex flex-col text-left">
              <span className="font-black text-lg">{isPlayingAudio ? 'Speaking Prompt...' : 'Listen to Prompt'}</span>
              <span className="text-xs sm:text-sm text-slate-400 font-normal">
                {isElevenLabsActive ? 'Powered by ElevenLabs AI Voice' : 'Tap to hear speech prompt'}
              </span>
            </div>
          </motion.button>

          {/* Record Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={isListening ? stopRecording : startRecording}
            className={`w-full h-28 sm:h-32 rounded-2xl text-white font-bold text-base sm:text-lg flex items-center justify-center gap-4 transition-all cursor-pointer shadow-xl p-5 text-center ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400'
            }`}
          >
            <Mic className="w-8 h-8" />
            <div className="flex flex-col text-left">
              <span className="font-black text-lg">{isListening ? 'Stop Recording' : 'Tap to Speak Phrase'}</span>
              <span className="text-xs sm:text-sm text-white/80 font-normal">
                {isListening ? 'Listening & analyzing slurring...' : 'Repeat phrase out loud'}
              </span>
            </div>
          </motion.button>

          {/* Transcribed Output & Slurring Badge */}
          {transcript && (
            <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-slate-400">Speech Audio Heard:</span>
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

              <p className="text-sm font-medium text-slate-200 italic">
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
                        ? '⚠️ Speech Slurring / Slow Articulation Detected'
                        : 'Speech Articulation: Crisp & Clear'}
                    </span>
                  </div>
                  <span>Clarity: {analysis.slurScore}%</span>
                </div>
              )}
            </div>
          )}

          {/* Submit Button - Extra Large Area & Touch Target */}
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 35px rgba(16,185,129,0.5)' }}
            whileTap={{ scale: 0.96 }}
            onClick={handleFinishTest}
            className="w-full min-h-[76px] sm:min-h-[88px] py-6 sm:py-7 px-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 cursor-pointer shadow-2xl transition-all border border-emerald-400/30"
          >
            <CheckCircle className="w-8 h-8 text-white flex-shrink-0" />
            <span>Submit Voice Test</span>
          </motion.button>
        </div>
      </div>
    </PageTransition>
  );
}
