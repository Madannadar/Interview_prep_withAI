'use client';

import { interviewer } from '@/constants';
import { createFeedback } from '@/lib/actions/general.action';
import { cn } from '@/lib/utils';
import { vapi } from '@/lib/vapi.sdk';
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';
import { useAudioDebugger } from '@/hooks/useAudioDebugger';
import CognitiveInsightPanel from '@/components/CognitiveInsightPanel';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

type ListeningState = 'idle' | 'ai-speaking' | 'listening' | 'processing';

interface SavedMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

// ── Small inline debug panel ──────────────────────────────────────────────────
function AudioDebugPanel({
    volume,
    isSpeaking,
    micGranted,
    streamActive,
    partial,
    lastFinal,
    trackLabels,
    silenceMs,
    error,
}: {
    volume: number;
    isSpeaking: boolean;
    micGranted: boolean | null;
    streamActive: boolean;
    partial: string;
    lastFinal: string;
    trackLabels: string[];
    silenceMs: number;
    error: string | null;
}) {
    const barWidth = Math.min(100, (volume / 255) * 100);
    const barColor =
        volume > 50 ? '#49de50' :
            volume > 20 ? '#facc15' :
                '#6870a6';

    return (
        <div style={{
            position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
            background: 'rgba(10,10,20,0.92)', border: '1px solid rgba(100,100,200,0.3)',
            borderRadius: 12, padding: '12px 16px', width: 320,
            fontFamily: 'monospace', fontSize: 11, color: '#cac5fe',
            backdropFilter: 'blur(12px)', boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
        }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#fff', fontSize: 12 }}>
                🎙️ Audio Debug Panel
            </div>

            {/* Mic status */}
            <div style={{ marginBottom: 4 }}>
                <span style={{ color: '#6870a6' }}>Mic: </span>
                <span style={{ color: micGranted === true ? '#49de50' : micGranted === false ? '#f75353' : '#facc15' }}>
                    {micGranted === null ? 'not requested' : micGranted ? '✅ granted' : '❌ denied'}
                </span>
                {' | '}
                <span style={{ color: streamActive ? '#49de50' : '#f75353' }}>
                    stream: {streamActive ? 'active' : 'inactive'}
                </span>
            </div>

            {/* Track info */}
            {trackLabels.length > 0 && (
                <div style={{ marginBottom: 4, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    🎤 {trackLabels[0] || 'unnamed device'}
                </div>
            )}

            {/* Volume bar */}
            <div style={{ marginBottom: 4 }}>
                <div style={{ color: '#6870a6', marginBottom: 2 }}>
                    [AUDIO LEVEL] {volume}
                    {isSpeaking && <span style={{ color: '#49de50', marginLeft: 8 }}>🔊 speaking</span>}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{
                        width: `${barWidth}%`, height: '100%',
                        background: barColor,
                        transition: 'width 0.1s ease, background 0.3s ease',
                        borderRadius: 4,
                    }} />
                </div>
            </div>

            {/* Silence */}
            {!isSpeaking && silenceMs > 500 && (
                <div style={{ color: '#facc15', marginBottom: 4 }}>
                    [SILENCE] {(silenceMs / 1000).toFixed(1)}s
                </div>
            )}

            {/* Partial transcript */}
            {partial && (
                <div style={{ marginBottom: 4 }}>
                    <span style={{ color: '#6870a6' }}>[STT partial] </span>
                    <span style={{ color: '#facc15' }}>{partial}</span>
                </div>
            )}

            {/* Last final transcript */}
            {lastFinal && (
                <div style={{ marginBottom: 4 }}>
                    <span style={{ color: '#6870a6' }}>[STT final] </span>
                    <span style={{ color: '#49de50' }}>{lastFinal}</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ color: '#f75353', marginTop: 4 }}>
                    ❌ {error}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

const Agent = ({ userName, userId, type, interviewId, questions }: AgentProps) => {
    const router = useRouter();
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [listeningState, setListeningState] = useState<ListeningState>('idle');
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [micError, setMicError] = useState<string | null>(null);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const messagesRef = useRef<SavedMessage[]>([]);
    const latestCognitiveRef = useRef<CognitiveAnalysisResponse | null>(null);
    const lastAnalyzedCountRef = useRef(0);
    const behaviorMetricsRef = useRef<BehaviorMetrics>({
        pauseCount: 0, tabSwitches: 0, avgResponseDelay: 0,
        sessionDurationSeconds: 0, speechActivityRatio: 0,
    });

    useEffect(() => { messagesRef.current = messages; }, [messages]);

    // ── Cognitive state ───────────────────────────────────────────────────────
    const [cognitiveData, setCognitiveData] = useState<CognitiveAnalysisResponse | null>(null);
    const [isCognitiveLoading, setIsCognitiveLoading] = useState(false);

    // ── Behavior tracker ──────────────────────────────────────────────────────
    const { metrics: behaviorMetrics, onAISpeechEnd, onUserSpeechStart, onSessionStart } =
        useBehaviorTracker();
    useEffect(() => { behaviorMetricsRef.current = behaviorMetrics; }, [behaviorMetrics]);

    // ── Audio debugger ────────────────────────────────────────────────────────
    const {
        debugState,
        startMicMonitoring,
        stopMicMonitoring,
        onSTTSpeechStart,
        onSTTSpeechEnd,
        onSTTTranscript,
    } = useAudioDebugger();

    // ── Vapi global events ────────────────────────────────────────────────────
    useEffect(() => {
        const onCallStart = () => {
            console.log('[vapi] ✅ call-start');
            setCallStatus(CallStatus.ACTIVE);
            setListeningState('ai-speaking');
            onSessionStart();
        };

        const onCallEnd = () => {
            console.log('[vapi] 🔴 call-end');
            setCallStatus(CallStatus.FINISHED);
            setListeningState('idle');
            stopMicMonitoring();
        };

        const onMessage = (message: Message) => {
            // Partial transcript
            if (message.type === 'transcript' && message.transcriptType === 'partial') {
                onSTTTranscript(message.transcript, false, message.role);
                return;
            }
            // Final transcript
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                onSTTTranscript(message.transcript, true, message.role);
                const newMessage = { role: message.role, content: message.transcript };
                setMessages(prev => [...prev, newMessage]);

                if (message.role === 'assistant') setListeningState('listening');
                else if (message.role === 'user') setListeningState('processing');
            }
        };

        const onSpeechStart = () => {
            console.log('[vapi] 🎙️ speech-start (AI TTS)');
            setIsSpeaking(true);
            setListeningState('ai-speaking');
        };

        const onSpeechEnd = () => {
            console.log('[vapi] 👂 speech-end — entering listening mode');
            setIsSpeaking(false);
            setListeningState('listening');
            onAISpeechEnd();
            onSTTSpeechEnd();
        };

        const onVolumeLevel = (level: number) => {
            if (listeningState === 'listening' && level > 0.05) {
                onUserSpeechStart();
                onSTTSpeechStart();
            }
        };

        const onError = (error: Error) =>
            console.error('[vapi] ❌ error:', error);

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('volume-level', onVolumeLevel);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('volume-level', onVolumeLevel);
            vapi.off('error', onError);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onSessionStart, onAISpeechEnd, onUserSpeechStart, listeningState,
        onSTTSpeechStart, onSTTSpeechEnd, onSTTTranscript, stopMicMonitoring]);

    // ── Cognitive analysis ────────────────────────────────────────────────────
    const runCognitiveAnalysis = useCallback(async (currentMessages: SavedMessage[]) => {
        if (currentMessages.length < 2) return;
        const userMessages = currentMessages.filter(m => m.role === 'user');
        if (userMessages.length === 0 || userMessages.length === lastAnalyzedCountRef.current) return;

        lastAnalyzedCountRef.current = userMessages.length;
        setIsCognitiveLoading(true);
        try {
            const res = await fetch('/api/cognitive-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: currentMessages, behaviorMetrics: behaviorMetricsRef.current }),
            });
            if (res.ok) {
                const data: CognitiveAnalysisResponse = await res.json();
                setCognitiveData(data);
                latestCognitiveRef.current = data;
            }
        } catch (err) {
            console.error('[cognitive] fetch failed:', err);
        } finally {
            setIsCognitiveLoading(false);
        }
    }, []);

    useEffect(() => {
        if (callStatus === CallStatus.ACTIVE && messages.length > 0)
            runCognitiveAnalysis(messages);
    }, [messages, callStatus, runCognitiveAnalysis]);

    // ── Feedback ──────────────────────────────────────────────────────────────
    const handleGenerateFeedback = useCallback(async () => {
        const { success, feedbackId: id } = await createFeedback({
            interviewId: interviewId!,
            userId: userId!,
            transcript: messagesRef.current,
            cognitiveData: latestCognitiveRef.current,
            behaviorMetrics: behaviorMetricsRef.current,
        });
        if (success && id) router.push(`/interview/${interviewId}/feedback`);
        else router.push('/');
    }, [interviewId, userId, router]);

    useEffect(() => {
        if (callStatus !== CallStatus.FINISHED) return;
        if (type === 'generate') router.push('/');
        else handleGenerateFeedback();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callStatus]);

    // ── Call controls ─────────────────────────────────────────────────────────
    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);
        console.log('[call] Starting — requesting mic + launching Vapi…');

        // Start Web Audio monitor BEFORE vapi.start so we get pre-call volume
        await startMicMonitoring();

        if (type === 'generate') {
            await vapi.start(process.env.NEXT_PUBLIC_WORKFLOW_ID!, {
                variableValues: { username: userName, userid: userId },
            });
        } else {
            const formattedQuestions = questions
                ? questions.map(q => `- ${q}`).join('\n')
                : '';
            await vapi.start(interviewer, {
                variableValues: { questions: formattedQuestions },
            });
        }
    };

    const handleDisconnect = () => {
        console.log('[call] User disconnected');
        vapi.stop();
        setCallStatus(CallStatus.FINISHED);
        stopMicMonitoring();
    };

    // ── Derived UI state ──────────────────────────────────────────────────────
    const latestMessage = messages[messages.length - 1]?.content;
    const isCallInactiveOrFinished =
        callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;
    const showPanel =
        type === 'interview' && (callStatus === CallStatus.ACTIVE || cognitiveData !== null);
    const showDebugPanel = callStatus !== CallStatus.INACTIVE;

    const listeningLabel = (() => {
        switch (listeningState) {
            case 'ai-speaking': return isSpeaking ? '🎙️ Speaking…' : '⏳ Preparing…';
            case 'listening': return '👂 Listening…';
            case 'processing': return '🤔 Processing…';
            default: return '';
        }
    })();

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <div className={showPanel ? 'interview-with-panel' : ''}>

                {/* ── Main Interview Area ── */}
                <div className={showPanel ? 'interview-main' : 'w-full flex flex-col gap-6'}>

                    {/* Mic error banner */}
                    {micError && (
                        <div className="w-full rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                            🎙️ <strong>Microphone Error:</strong> {micError}.
                            Please allow microphone access in your browser settings and try again.
                        </div>
                    )}

                    {/* Live partial transcript banner */}
                    {debugState.partialTranscript && callStatus === CallStatus.ACTIVE && (
                        <div className="w-full rounded-xl bg-yellow-500/10 border border-yellow-500/25 px-4 py-2 text-sm text-yellow-300 transition-all">
                            <span className="opacity-60 mr-2">Listening:</span>
                            {debugState.partialTranscript}
                        </div>
                    )}

                    {/* Call View */}
                    <div className='call-view'>

                        {/* AI Interviewer */}
                        <div className='card-interviewer'>
                            <div className='avatar'>
                                <Image src='/ai-avatar.png' alt='AI Interviewer'
                                    width={65} height={54} className='object-cover' />
                                {isSpeaking && <span className='animate-speak' />}
                            </div>
                            <h3>AI Interviewer</h3>
                            {callStatus === CallStatus.ACTIVE && listeningLabel && (
                                <span className={cn(
                                    'text-[11px] mt-1 font-medium',
                                    listeningState === 'listening' ? 'text-green-400' : 'text-light-400'
                                )}>
                                    {listeningLabel}
                                </span>
                            )}
                        </div>

                        {/* User */}
                        <div className='card-border'>
                            <div className='card-content'>
                                <Image src='/user-avatar.png' alt='user avatar'
                                    width={540} height={540}
                                    className='rounded-full object-cover size-[120px]' />
                                <h3>{userName}</h3>

                                {callStatus === CallStatus.ACTIVE && cognitiveData && (
                                    <span className='text-[11px] text-light-600 mt-1 text-center'>
                                        {cognitiveData.signals.behavior.modifier === 'Distracted' ? '⚡ Minor distractions observed'
                                            : cognitiveData.signals.behavior.modifier === 'Hesitant' ? '⏸ Some hesitation detected'
                                                : cognitiveData.signals.behavior.modifier === 'Confident' ? '✓ Focus appears consistent'
                                                    : ''}
                                    </span>
                                )}

                                {/* Listening indicator + live volume bar */}
                                {listeningState === 'listening' && (
                                    <div className='flex flex-col items-center gap-1 mt-2 w-full'>
                                        <div className='flex items-center gap-1.5'>
                                            <span className='relative flex h-2 w-2'>
                                                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75' />
                                                <span className='relative inline-flex rounded-full h-2 w-2 bg-green-400' />
                                            </span>
                                            <span className='text-[11px] text-green-400 font-medium'>
                                                {debugState.isSpeakingDetected ? 'Speech detected' : 'Listening…'}
                                            </span>
                                        </div>
                                        {/* Mini volume bar under user card */}
                                        <div className='w-24 h-1.5 bg-white/10 rounded-full overflow-hidden'>
                                            <div
                                                className='h-full rounded-full transition-all duration-100'
                                                style={{
                                                    width: `${Math.min(100, (debugState.volumeLevel / 255) * 100)}%`,
                                                    background: debugState.isSpeakingDetected ? '#49de50' : '#6870a6',
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Transcript */}
                    {messages.length > 0 && (
                        <div className='transcript-border'>
                            <div className='transcript'>
                                <p key={latestMessage}
                                    className={cn('transition-opacity duration-500 opacity-0', 'animate-fadeIn opacity-100')}>
                                    {latestMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Call / End button */}
                    <div className='w-full flex justify-center'>
                        {callStatus !== 'ACTIVE' ? (
                            <button className='relative btn-call' onClick={handleCall}>
                                <span className={cn(
                                    'absolute animate-ping rounded-full opacity-75',
                                    callStatus !== 'CONNECTING' && 'hidden'
                                )} />
                                <span>{isCallInactiveOrFinished ? 'Call' : '. . .'}</span>
                            </button>
                        ) : (
                            <button className='btn-disconnect' onClick={handleDisconnect}>End</button>
                        )}
                    </div>
                </div>

                {/* ── Cognitive Sidebar ── */}
                {showPanel && (
                    <div className='interview-sidebar'>
                        <CognitiveInsightPanel data={cognitiveData} isLoading={isCognitiveLoading} />
                    </div>
                )}
            </div>

            {/* ── Fixed Audio Debug Panel (bottom-right) ── */}
            {showDebugPanel && (
                <AudioDebugPanel
                    volume={debugState.volumeLevel}
                    isSpeaking={debugState.isSpeakingDetected}
                    micGranted={debugState.micGranted}
                    streamActive={debugState.streamActive}
                    partial={debugState.partialTranscript}
                    lastFinal={debugState.lastTranscript}
                    trackLabels={debugState.trackLabels}
                    silenceMs={debugState.silenceDurationMs}
                    error={debugState.error}
                />
            )}
        </>
    );
};

export default Agent;
