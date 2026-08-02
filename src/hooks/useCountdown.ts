import { useState, useEffect, useCallback, useRef } from 'react';

export function useCountdown(durationMs: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = useState(durationMs);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const start = useCallback(() => {
    setTimeLeft(durationMs);
    setIsRunning(true);
  }, [durationMs]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(durationMs);
  }, [stop, durationMs]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 100;
        if (next <= 0) {
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const progress = 1 - timeLeft / durationMs;
  const seconds = Math.ceil(timeLeft / 1000);

  return { timeLeft, seconds, progress, isRunning, start, stop, reset };
}
