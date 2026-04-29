'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AudioDebugState {
  micGranted: boolean | null;        // null = not yet requested
  streamActive: boolean;
  trackCount: number;
  trackLabels: string[];
  volumeLevel: number;               // 0–100
  isSpeakingDetected: boolean;       // true when volume > threshold
  silenceDurationMs: number;         // ms since last speech
  lastTranscript: string;
  partialTranscript: string;
  transcriptHistory: string[];
  error: string | null;
}

const SILENCE_THRESHOLD = 8;        // volume 0–100; below this = silence
const SPEAKING_THRESHOLD = 12;      // above this = speaking detected
const POLL_INTERVAL_MS   = 150;     // how often to sample analyser

export function useAudioDebugger() {
  const [state, setState] = useState<AudioDebugState>({
    micGranted: null,
    streamActive: false,
    trackCount: 0,
    trackLabels: [],
    volumeLevel: 0,
    isSpeakingDetected: false,
    silenceDurationMs: 0,
    lastTranscript: '',
    partialTranscript: '',
    transcriptHistory: [],
    error: null,
  });

  // Internal refs — no re-render on change
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const sourceRef      = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const dataArrayRef   = useRef<Uint8Array | null>(null);
  const isMonitoringRef = useRef(false);

  // ── Start mic + Web Audio monitoring ─────────────────────────────────────
  const startMicMonitoring = useCallback(async () => {
    if (isMonitoringRef.current) return;

    console.log('[MIC] Requesting microphone access…');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      isMonitoringRef.current = true;

      const tracks = stream.getTracks();
      const labels  = tracks.map(t => t.label || 'unlabelled track');

      console.log('[MIC] ✅ Access granted');
      console.log('[MIC] Stream active:', stream.active);
      console.log('[MIC] Tracks:', tracks);
      tracks.forEach((t, i) =>
        console.log(`[MIC] Track[${i}]:`, t.label, '| kind:', t.kind, '| state:', t.readyState)
      );

      setState(s => ({
        ...s,
        micGranted: true,
        streamActive: stream.active,
        trackCount: tracks.length,
        trackLabels: labels,
        error: null,
      }));

      // ── Build Web Audio pipeline ────────────────────────────────────────
      const ctx      = new AudioContext({ sampleRate: 16000 });
      const analyser = ctx.createAnalyser();
      analyser.fftSize           = 256;
      analyser.smoothingTimeConstant = 0.8;
      const bufferLength = analyser.frequencyBinCount; // 128
      dataArrayRef.current = new Uint8Array(bufferLength);

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      // NOT connected to ctx.destination — we don't want to hear ourselves

      audioCtxRef.current  = ctx;
      analyserRef.current  = analyser;
      sourceRef.current    = source;

      console.log('[AUDIO] AudioContext created. sampleRate:', ctx.sampleRate,
        '| analyser fftSize:', analyser.fftSize);

      // ── Polling loop ────────────────────────────────────────────────────
      pollTimerRef.current = setInterval(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const avg = dataArrayRef.current.reduce((a, b) => a + b, 0)
          / dataArrayRef.current.length;
        const volume = Math.round(avg);   // 0–255 → 0–255, print raw

        const isSpeaking = volume > SPEAKING_THRESHOLD;

        if (volume > SILENCE_THRESHOLD) {
          console.log('[AUDIO LEVEL]:', volume,
            isSpeaking ? '🔊 (speaking detected)' : '');
          silenceStartRef.current = null;
        } else {
          if (silenceStartRef.current === null) {
            silenceStartRef.current = Date.now();
          }
          const silenceMs = Date.now() - silenceStartRef.current;
          if (silenceMs > 0 && silenceMs % 2000 < POLL_INTERVAL_MS + 10) {
            console.log(`[SILENCE] No speech detected for ${silenceMs} ms`);
          }
          setState(s => ({ ...s, silenceDurationMs: silenceMs }));
        }

        setState(s => ({
          ...s,
          volumeLevel: volume,
          isSpeakingDetected: isSpeaking,
          streamActive: streamRef.current?.active ?? false,
        }));
      }, POLL_INTERVAL_MS);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MIC] ❌ Permission denied or error:', err);
      setState(s => ({ ...s, micGranted: false, error: msg }));
    }
  }, []);

  // ── Stop monitoring + cleanup ─────────────────────────────────────────────
  const stopMicMonitoring = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    sourceRef.current?.disconnect();
    analyserRef.current  = null;
    audioCtxRef.current?.close();
    audioCtxRef.current  = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current    = null;
    isMonitoringRef.current = false;

    console.log('[MIC] Monitoring stopped and stream released.');
    setState(s => ({
      ...s,
      volumeLevel: 0,
      isSpeakingDetected: false,
      streamActive: false,
      silenceDurationMs: 0,
    }));
  }, []);

  // ── Call from Vapi event handlers ─────────────────────────────────────────

  const onSTTSpeechStart = useCallback(() => {
    console.log('[STT] 🎤 Speech started — Vapi is listening');
    silenceStartRef.current = null;
    setState(s => ({ ...s, isSpeakingDetected: true, silenceDurationMs: 0 }));
  }, []);

  const onSTTSpeechEnd = useCallback(() => {
    console.log('[STT] 🔇 Speech ended — sending to transcription…');
    setState(s => ({ ...s, isSpeakingDetected: false }));
  }, []);

  const onSTTTranscript = useCallback((
    transcript: string,
    isFinal: boolean,
    role: string,
  ) => {
    if (isFinal) {
      console.log(`[STT] ✅ Final transcript [${role}]:`, transcript);
      setState(s => ({
        ...s,
        lastTranscript: transcript,
        partialTranscript: '',
        transcriptHistory: [...s.transcriptHistory.slice(-9), `[${role}] ${transcript}`],
      }));
    } else {
      console.log('[STT] 🔤 Partial transcript:', transcript);
      setState(s => ({ ...s, partialTranscript: transcript }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stopMicMonitoring(); }, [stopMicMonitoring]);

  return {
    debugState: state,
    startMicMonitoring,
    stopMicMonitoring,
    onSTTSpeechStart,
    onSTTSpeechEnd,
    onSTTTranscript,
  };
}
