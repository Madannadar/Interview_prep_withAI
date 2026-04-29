'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Re-export computeFocusScore from lib/utils so callers don't need two imports
export { computeFocusScore } from '@/lib/utils';

/**
 * useBehaviorTracker
 *
 * Tracks client-side behavioral signals during a voice interview:
 * - pauseCount   : long silences (>4 s) between AI speech end and user response
 * - tabSwitches  : times the user left the browser tab
 * - avgResponseDelay : avg seconds from AI speech end → user speech start
 * - sessionDurationSeconds : total elapsed interview time
 * - speechActivityRatio    : proportion of session the user was speaking
 */
export function useBehaviorTracker() {
  const [metrics, setMetrics] = useState<BehaviorMetrics>({
    pauseCount: 0,
    tabSwitches: 0,
    avgResponseDelay: 0,
    sessionDurationSeconds: 0,
    speechActivityRatio: 0,
  });

  // Internal refs — mutable without triggering re-renders
  const sessionStartRef = useRef<number>(Date.now());
  const tabSwitchesRef = useRef(0);
  const pauseCountRef = useRef(0);

  const aiSpeechEndTimeRef = useRef<number | null>(null);
  const responseDelaysRef = useRef<number[]>([]);

  const userSpeechStartRef = useRef<number | null>(null);
  const totalUserSpeechMsRef = useRef(0);

  // ── Tab visibility tracking ──────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchesRef.current += 1;
        updateMetrics();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Compute and flush metrics to state ──────────────────────────────────
  const updateMetrics = useCallback(() => {
    const sessionDurationSeconds = (Date.now() - sessionStartRef.current) / 1000;
    const speechActivityRatio =
      sessionDurationSeconds > 0
        ? Math.min(totalUserSpeechMsRef.current / 1000 / sessionDurationSeconds, 1)
        : 0;

    const delays = responseDelaysRef.current;
    const avgResponseDelay =
      delays.length > 0
        ? delays.reduce((a, b) => a + b, 0) / delays.length
        : 0;

    setMetrics({
      pauseCount: pauseCountRef.current,
      tabSwitches: tabSwitchesRef.current,
      avgResponseDelay: Math.round(avgResponseDelay * 10) / 10,
      sessionDurationSeconds: Math.round(sessionDurationSeconds),
      speechActivityRatio: Math.round(speechActivityRatio * 100) / 100,
    });
  }, []);

  // ── Public event handlers ─────────────────────────────────────────────────

  /** Call when the AI (interviewer) finishes speaking */
  const onAISpeechEnd = useCallback(() => {
    aiSpeechEndTimeRef.current = Date.now();
  }, []);

  /** Call when the user starts speaking */
  const onUserSpeechStart = useCallback(() => {
    userSpeechStartRef.current = Date.now();

    if (aiSpeechEndTimeRef.current !== null) {
      const delay = (Date.now() - aiSpeechEndTimeRef.current) / 1000;
      responseDelaysRef.current.push(delay);
      if (delay > 4) pauseCountRef.current += 1; // long gap = hesitation pause
      aiSpeechEndTimeRef.current = null;
    }

    updateMetrics();
  }, [updateMetrics]);

  /** Call when the user stops speaking */
  const onUserSpeechEnd = useCallback(() => {
    if (userSpeechStartRef.current !== null) {
      totalUserSpeechMsRef.current += Date.now() - userSpeechStartRef.current;
      userSpeechStartRef.current = null;
    }
    updateMetrics();
  }, [updateMetrics]);

  /** Call when the interview session starts — resets all counters */
  const onSessionStart = useCallback(() => {
    sessionStartRef.current = Date.now();
    tabSwitchesRef.current = 0;
    pauseCountRef.current = 0;
    aiSpeechEndTimeRef.current = null;
    responseDelaysRef.current = [];
    userSpeechStartRef.current = null;
    totalUserSpeechMsRef.current = 0;
    updateMetrics();
  }, [updateMetrics]);

  return {
    metrics,
    onAISpeechEnd,
    onUserSpeechStart,
    onUserSpeechEnd,
    onSessionStart,
  };
}
