'use client';

import { useEffect, useState } from 'react';

// ─── Sub-components ──────────────────────────────────────────────────────────

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.round(value * 100)), 120);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="confidence-bar-track">
      <div
        className="confidence-bar-fill"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

function getConfidenceColor(confidence: number): string {
  if (confidence > 0.8)  return '#49de50'; // green
  if (confidence >= 0.5) return '#facc15'; // yellow
  return '#f75353';                         // red
}

function getConfidenceLabel(confidence: number): string {
  if (confidence > 0.8)  return 'High';
  if (confidence >= 0.5) return 'Moderate';
  return 'Low';
}

function getAdaptiveHint(
  approach: DetectedApproach,
  confidence: number,
  nlpApproach: DetectedApproach,
  codeApproach: DetectedApproach,
): string {
  const signalsDisagree =
    nlpApproach !== codeApproach &&
    nlpApproach !== 'Unknown' &&
    codeApproach !== 'Unknown';

  if (signalsDisagree) return 'Your explanation and approach seem to diverge — try clarifying your reasoning.';

  if (confidence < 0.5) return 'Take a moment to structure your thoughts before diving in.';

  if (confidence < 0.8) {
    if (approach === 'Brute Force')         return 'Good start — can you think of a more optimal solution?';
    if (approach === 'Dynamic Programming') return 'Define your state and transitions clearly.';
    if (approach === 'Sliding Window')      return 'Explain your window conditions precisely.';
    return 'Good start — go deeper into edge cases.';
  }

  // High confidence
  if (approach === 'Brute Force')         return 'Strong explanation — now optimize the time complexity.';
  if (approach === 'Dynamic Programming') return 'Excellent — consider space optimization too.';
  if (approach === 'Sliding Window')      return 'Great — what are the boundary invariants?';
  return 'Excellent performance — keep going!';
}

const APPROACH_ICONS: Partial<Record<DetectedApproach, string>> = {
  'Brute Force':         '🔨',
  'Sliding Window':      '🪟',
  'Dynamic Programming': '📐',
  'Divide and Conquer':  '✂️',
  'Greedy':              '💰',
  'BFS/DFS':             '🌐',
  'Two Pointers':        '👆',
  'Binary Search':       '🔍',
  'Behavioral':          '🗣️',
  'System Design':       '🏗️',
  'Unknown':             '❓',
};

function ApproachBadge({ approach }: { approach: DetectedApproach }) {
  return (
    <span className="approach-badge">
      <span>{APPROACH_ICONS[approach] ?? '💡'}</span>
      {approach}
    </span>
  );
}

function ShimmerBlock({ height = 'h-4' }: { height?: string }) {
  return <div className={`animate-shimmer rounded-lg ${height} w-full`} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CognitiveInsightPanel({
  data,
  isLoading,
}: CognitiveInsightPanelProps) {
  const hasData = !!data && !isLoading;
  const confidenceColor = hasData ? getConfidenceColor(data.confidence) : '#6870a6';

  return (
    <div className="cognitive-panel animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <span className="text-xs font-bold uppercase tracking-widest text-light-400">
            Cognitive Analysis
          </span>
        </div>
        {/* Live pulse dot — color reflects current confidence */}
        <div
          className="w-2 h-2 rounded-full animate-confidence-pulse"
          style={{ backgroundColor: isLoading ? '#6870a6' : confidenceColor }}
        />
      </div>

      {/* ── Detected Approach ── */}
      <div className="insight-card">
        <span className="signal-label">Detected Approach</span>
        {isLoading ? (
          <ShimmerBlock height="h-6" />
        ) : hasData ? (
          <div className="mt-1">
            <ApproachBadge approach={data.approach} />
          </div>
        ) : (
          <span className="text-xs text-light-600 italic">Waiting for response…</span>
        )}
      </div>

      {/* ── Confidence Level ── */}
      <div className="insight-card">
        <div className="flex items-center justify-between">
          <span className="signal-label">Confidence</span>
          {hasData && (
            <span className="text-xs font-bold" style={{ color: confidenceColor }}>
              {getConfidenceLabel(data.confidence)} ({Math.round(data.confidence * 100)}%)
            </span>
          )}
        </div>
        {isLoading ? (
          <ShimmerBlock />
        ) : hasData ? (
          <ConfidenceBar value={data.confidence} color={confidenceColor} />
        ) : (
          <div className="confidence-bar-track">
            <div className="confidence-bar-fill" style={{ width: '0%' }} />
          </div>
        )}
      </div>

      {/* ── Signal Breakdown ── */}
      {(hasData || isLoading) && (
        <div className="flex flex-col gap-2">
          <span className="signal-label">Signal Breakdown</span>
          <div className="grid grid-cols-2 gap-2">

            {/* NLP Signal */}
            <div className="insight-card">
              <span className="signal-label">NLP</span>
              {isLoading ? (
                <ShimmerBlock height="h-3" />
              ) : hasData ? (
                <>
                  <span className="signal-value text-xs">{data.signals.nlp.approach}</span>
                  <ConfidenceBar
                    value={data.signals.nlp.confidence}
                    color={getConfidenceColor(data.signals.nlp.confidence)}
                  />
                </>
              ) : null}
            </div>

            {/* Code Signal */}
            <div className="insight-card">
              <span className="signal-label">Code</span>
              {isLoading ? (
                <ShimmerBlock height="h-3" />
              ) : hasData ? (
                <>
                  <span className="signal-value text-xs">{data.signals.code.approach}</span>
                  <ConfidenceBar
                    value={data.signals.code.confidence}
                    color={getConfidenceColor(data.signals.code.confidence)}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Signal Agreement ── */}
      {hasData &&
        data.signals.nlp.approach !== 'Unknown' &&
        data.signals.code.approach !== 'Unknown' && (
          <div className="insight-card">
            <span className="signal-label">Signal Agreement</span>
            {data.signals.nlp.approach === data.signals.code.approach ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-success-100 text-sm">✓</span>
                <span className="text-xs text-success-100 font-medium">Signals aligned</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-yellow-400 text-sm">⚡</span>
                <span className="text-xs text-yellow-400 font-medium">Signals diverging</span>
              </div>
            )}
          </div>
        )}

      {/* ── Behavior ── */}
      {hasData && (
        <div className="insight-card">
          <span className="signal-label">Focus & Behavior</span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-light-100">{data.signals.behavior.modifier}</span>
            <div className="flex items-center gap-1.5">
              {data.signals.behavior.details.tabSwitches > 0 && (
                <span className="text-xs text-yellow-400">
                  ⚡ {data.signals.behavior.details.tabSwitches}&nbsp;switch
                  {data.signals.behavior.details.tabSwitches > 1 ? 'es' : ''}
                </span>
              )}
              {data.signals.behavior.details.pauseCount > 3 && (
                <span className="text-xs text-light-400">
                  ⏸ {data.signals.behavior.details.pauseCount}
                </span>
              )}
            </div>
          </div>
          {/* Contextual message — never accusatory */}
          <p className="text-[11px] text-light-600 leading-tight mt-1">
            {data.signals.behavior.modifier === 'Distracted'
              ? 'Minor distractions observed — stay focused!'
              : data.signals.behavior.modifier === 'Hesitant'
              ? 'Some hesitation detected — breathe and think aloud.'
              : data.signals.behavior.modifier === 'Confident'
              ? 'Confident engagement throughout.'
              : data.signals.behavior.modifier === 'Focused'
              ? 'Focus appears consistent.'
              : 'Steady performance.'}
          </p>
        </div>
      )}

      {/* ── Adaptive Hint ── */}
      {hasData && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-primary-200/5 border border-primary-200/15">
          <span className="text-primary-200 text-sm mt-0.5 flex-shrink-0">💡</span>
          <p className="text-[11px] text-primary-100 leading-relaxed">
            {getAdaptiveHint(
              data.approach,
              data.confidence,
              data.signals.nlp.approach,
              data.signals.code.approach,
            )}
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !hasData && (
        <p className="text-xs text-light-600 text-center py-2 italic">
          Analysis will appear as you respond to interview questions.
        </p>
      )}
    </div>
  );
}
