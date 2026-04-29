'use client';

import Vapi from '@vapi-ai/web';

// ── Create the singleton Vapi instance ────────────────────────────────────────
const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!token) {
  console.error(
    '[vapi.sdk] ❌ NEXT_PUBLIC_VAPI_WEB_TOKEN is not set! ' +
    'Check your .env.local file and restart the dev server.'
  );
}

export const vapi = new Vapi(token!);

// ── Global debug listeners ────────────────────────────────────────────────────
// These run for every vapi event in the entire app — open the browser console
// to diagnose voice issues in real time.
if (typeof window !== 'undefined') {

  vapi.on('call-start', () => {
    console.log('[vapi] ✅ call-start — WebRTC session established');
  });

  vapi.on('call-end', () => {
    console.log('[vapi] 🔴 call-end — session closed');
  });

  vapi.on('speech-start', () => {
    console.log('[vapi] 🎙️ speech-start — AI is speaking (TTS playing)');
  });

  vapi.on('speech-end', () => {
    console.log('[vapi] 👂 speech-end — AI finished speaking, mic should be active');
  });

  vapi.on('volume-level', (level: number) => {
    // Only log when there is meaningful audio to avoid console spam
    if (level > 0.05) {
      console.log(`[vapi] 🔊 volume-level: ${level.toFixed(3)} (user audio detected)`);
    }
  });

  // ── The two lines you requested ─────────────────────────────────────────────
  vapi.on('error', (e) => console.log('[vapi] ❌ Vapi error', e));
  vapi.on('message', (m) => console.log('[vapi] 📨 Vapi message', m));
}