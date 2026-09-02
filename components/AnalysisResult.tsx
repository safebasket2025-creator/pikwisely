'use client';

/**
 * components/AnalysisResult.tsx
 * Premium visual redesign — segmented donut, gradient bars, floating glass cards,
 * staggered animations, distinct section tints, 4-color accent system.
 */

import { useState } from 'react';
import type { GroqAnalysisResult } from '@/lib/groq';
import { useAuth } from '@clerk/nextjs';
import { createClerkSupabaseClient } from '@/lib/supabase-clerk';

export interface AnalysisResultProps extends GroqAnalysisResult {
  reportId?:         string | null;
  analysisId?:       string | null;
  creditsRemaining?: number | null;
  analysisMs?:       number | null;
}

// ─── Color system ─────────────────────────────────────────────────────────────
// POSITIVE  → emerald  #10b981 / #059669
// RISK      → rose     #f43f5e / #e11d48
// CAUTION   → amber    #f59e0b  (ONLY for verdict caution & mixed signals icon)
// BRAND     → indigo   #6366f1 / #4f46e5

const VERDICT_MAP = {
  'Strong Opportunity': {
    accent: '#059669',
    gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 60%, #6ee7b7 100%)',
    border: 'rgba(52,211,153,0.50)',
    iconBg: 'rgba(16,185,129,0.15)',
    pulseColor: 'rgba(16,185,129,0.35)',
    textDark: '#064e3b',
    textMid:  '#065f46',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.3" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  'Proceed with Caution': {
    accent: '#d97706',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 60%, #fcd34d 100%)',
    border: 'rgba(252,211,77,0.55)',
    iconBg: 'rgba(245,158,11,0.15)',
    pulseColor: 'rgba(245,158,11,0.35)',
    textDark: '#451a03',
    textMid:  '#78350f',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth="2.3" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
    ),
  },
  'High Risk': {
    accent: '#e11d48',
    gradient: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 60%, #fda4af 100%)',
    border: 'rgba(251,113,133,0.50)',
    iconBg: 'rgba(244,63,94,0.15)',
    pulseColor: 'rgba(244,63,94,0.35)',
    textDark: '#4c0519',
    textMid:  '#881337',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#e11d48" strokeWidth="2.3" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
} as const;

const CONF_COLOR: Record<string, string> = {
  High: '#059669', Medium: '#d97706', Low: '#e11d48',
};

// ─── Shared card style ────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.70)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.80)',
  borderRadius: 20,
  // Layered shadows for floating-glass depth
  boxShadow: [
    '0 1px 0 rgba(255,255,255,0.9) inset',
    '0 2px 4px rgba(0,0,0,0.04)',
    '0 8px 24px rgba(99,102,241,0.08)',
    '0 24px 48px rgba(99,102,241,0.04)',
  ].join(', '),
};

const GAP = 16;

// ─── Segmented Donut Chart ────────────────────────────────────────────────────

function SegmentedDonut({
  positive, neutral, negative,
}: { positive: number; neutral: number; negative: number }) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const CX = 56, CY = 56, R = 44, STROKE = 10;
  const CIRC = 2 * Math.PI * R;
  const GAP_DEG = 3; // small gap between segments in degrees
  const gapArc = (GAP_DEG / 360) * CIRC;

  // Arc lengths
  const posArc = (positive / 100) * CIRC - gapArc;
  const neuArc = (neutral  / 100) * CIRC - gapArc;
  const negArc = (negative / 100) * CIRC - gapArc;

  // Offsets: each segment starts where the previous ends
  // strokeDashoffset uses negative values to push the start forward
  const posStart = 0;
  const neuStart = posArc + gapArc;
  const negStart = neuStart + neuArc + gapArc;

  const segments = [
    { label: 'Positive', pct: positive, arc: posArc, offset: posStart, color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
    { label: 'Neutral',  pct: neutral,  arc: neuArc, offset: neuStart, color: '#94a3b8', glow: 'rgba(148,163,184,0.3)' },
    { label: 'Negative', pct: negative, arc: negArc, offset: negStart, color: '#f43f5e', glow: 'rgba(244,63,94,0.4)'   },
  ];

  return (
    <div style={{ position: 'relative', width: 112, height: 112, flexShrink: 0 }}>
      {/* Soft glow behind donut */}
      <div style={{
        position: 'absolute', inset: 8, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        filter: 'blur(8px)',
      }} />
      <svg
        width="112" height="112" viewBox="0 0 112 112"
        aria-label={`Sentiment: ${positive}% positive, ${neutral}% neutral, ${negative}% negative`}
        style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}
      >
        <defs>
          <filter id="donutGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(226,232,240,0.6)" strokeWidth={STROKE}/>

        {/* Segments */}
        {segments.map(({ label, pct, arc, offset, color }) => pct > 0 && (
          <circle
            key={label}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={color}
            strokeWidth={tooltip === label ? STROKE + 2 : STROKE}
            strokeLinecap="butt"
            strokeDasharray={`${arc} ${CIRC}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{
              transition: 'stroke-width 0.2s ease',
              cursor: 'pointer',
              filter: tooltip === label ? `drop-shadow(0 0 6px ${color})` : 'none',
            }}
            onMouseEnter={() => setTooltip(label)}
            onMouseLeave={() => setTooltip(null)}
          >
            <title>{label}: {pct}%</title>
          </circle>
        ))}

        {/* Centre label */}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="#0f172a" fontSize="18" fontWeight="900" fontFamily="Inter,system-ui,sans-serif">
          {positive}%
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Inter,system-ui,sans-serif" fontWeight="600">
          POSITIVE
        </text>
      </svg>
      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', fontSize: '0.63rem', fontWeight: 700,
          padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', pointerEvents: 'none',
          zIndex: 10,
        }}>
          {tooltip}: {tooltip === 'Positive' ? positive : tooltip === 'Neutral' ? neutral : negative}%
        </div>
      )}
    </div>
  );
}

// ─── Gradient progress bar with animation ────────────────────────────────────

function GradientBar({
  pct, gradient, delay = 0,
}: { pct: number; gradient: string; delay?: number }) {
  return (
    <div style={{
      height: 7, borderRadius: 20,
      background: 'rgba(0,0,0,0.06)',
      overflow: 'hidden', marginTop: 7,
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        width: `${Math.min(pct, 100)}%`, height: '100%',
        borderRadius: 20,
        background: gradient,
        animation: `barFill 0.9s cubic-bezier(0.34,1.20,0.64,1) ${delay}ms both`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
      }} />
    </div>
  );
}

// ─── Severity tag ─────────────────────────────────────────────────────────────

function SeverityTag({ severity }: { severity: 'Minor' | 'Severe' }) {
  const severe = severity === 'Severe';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.60rem', fontWeight: 700, letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: 20, flexShrink: 0,
      color:      severe ? '#9f1239' : '#92400e',
      background: severe ? 'rgba(244,63,94,0.10)' : 'rgba(245,158,11,0.12)',
      border:    `1px solid ${severe ? 'rgba(244,63,94,0.30)' : 'rgba(245,158,11,0.35)'}`,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: severe ? '#f43f5e' : '#f59e0b', display: 'inline-block',
      }} />
      {severity}
    </span>
  );
}

// ─── Hover-lift card wrapper ──────────────────────────────────────────────────

function FloatCard({
  children, style,
}: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...CARD,
        ...style,
        transform:  hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow:  hovered
          ? [
              '0 1px 0 rgba(255,255,255,0.9) inset',
              '0 4px 8px rgba(0,0,0,0.06)',
              '0 16px 40px rgba(99,102,241,0.14)',
              '0 32px 64px rgba(99,102,241,0.06)',
            ].join(', ')
          : CARD.boxShadow,
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalysisResult(props: AnalysisResultProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackError, setFeedbackError] = useState(false);
  const { getToken, userId } = useAuth();

  const handleFeedback = async (rating: 'helpful' | 'not_helpful') => {
    const idToUse = props.reportId || props.analysisId;
    if (!idToUse) return;
    
    setFeedbackError(false);
    if (!userId) return;
    const token = await getToken({ template: 'supabase' });
    const supabase = createClerkSupabaseClient(token);
    
    const { error } = await supabase.from('report_feedback').insert({
      report_id: idToUse,
      user_id: userId,
      rating
    });

    if (error) {
      setFeedbackError(true);
    } else {
      setFeedbackGiven(true);
    }
  };

  const {
    suggestion, confidence, confidenceReason,
    sentimentScore, neutralScore, negativeScore,
    topComplaints, topStrengths, inconsistencies,
    keyTakeaway, suggestedAction,
    reviewCount, dataSource, productName,
    creditsRemaining, analysisMs,
  } = props;

  const v = VERDICT_MAP[suggestion] ?? VERDICT_MAP['Proceed with Caution'];
  const strengths  = topStrengths.slice(0, 3);
  const complaints = topComplaints.slice(0, 3);

  return (
    <section
      id="live-result"
      aria-label="Analysis result"
      style={{ width: '100%', animation: 'arFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
    >
      <style>{`
        @keyframes arFadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes barFill {
          from { width: 0%; }
        }
        @keyframes verdictPulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--pulse-color); }
          50%       { box-shadow: 0 0 0 10px transparent; }
        }
        @keyframes iconPop {
          0%   { transform: scale(0.6); opacity:0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity:1; }
        }
      `}</style>

      {/* ── 1. KEY TAKEAWAY ─────────────────────────────────────────────────── */}
      {keyTakeaway && (
        <FloatCard style={{
          marginBottom: GAP,
          background: 'linear-gradient(135deg, rgba(238,242,255,0.92) 0%, rgba(237,233,254,0.75) 100%)',
          border: '1.5px solid rgba(99,102,241,0.25)',
          padding: '20px 24px',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          {/* Glowing icon */}
          <div style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 14px rgba(99,102,241,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'iconPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '0.60rem', fontWeight: 800, color: '#6366f1',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
            }}>
              Key Takeaway
            </p>
            <p style={{ fontSize: '1.02rem', fontWeight: 700, color: '#1e1b4b', lineHeight: 1.5, margin: 0 }}>
              {keyTakeaway}
            </p>
          </div>
        </FloatCard>
      )}

      {/* ── 2. VERDICT BADGE / CERTIFICATE ──────────────────────────────────── */}
      <div style={{
        ...CARD,
        marginBottom: GAP,
        background: v.gradient,
        border: `1.5px solid ${v.border}`,
        padding: '0',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Subtle shimmer overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, rgba(255,255,255,0.45) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div className="flex flex-col sm:flex-row items-center p-[20px_26px] relative z-10 gap-6 sm:gap-0 text-center sm:text-left">

          {/* Left: Pikwisely pulsing icon */}
          <div className="flex flex-col sm:flex-row items-center gap-[14px] flex-1 min-w-0">
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: v.iconBg,
              border: `1.5px solid ${v.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'iconPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
              // CSS custom property for pulse
              ['--pulse-color' as string]: v.pulseColor,
            }}>
              {v.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.59rem', fontWeight: 800, color: v.textMid, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
                Verdict
              </p>
              <p style={{ fontSize: '1.05rem', fontWeight: 900, color: v.textDark, margin: 0, lineHeight: 1.15 }}>
                {suggestion}
              </p>
              {productName && (
                <p style={{ fontSize: '0.70rem', color: v.textMid, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {productName}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-[1px] self-stretch mx-[20px] shrink-0" style={{ background: v.border }} />

          {/* Centre: Confidence */}
          <div style={{ flex: '1 1 0', textAlign: 'center' }}>
            <span style={{
              display: 'inline-block', fontSize: '0.70rem', fontWeight: 800,
              letterSpacing: '0.06em', padding: '5px 14px', borderRadius: 20,
              color: CONF_COLOR[confidence] ?? '#475569',
              background: 'rgba(255,255,255,0.70)',
              border: `1.5px solid ${CONF_COLOR[confidence] ?? '#94a3b8'}55`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: 5,
            }}>
              {confidence} Confidence
            </span>
            {confidenceReason && (
              <p style={{ fontSize: '0.68rem', color: v.textMid, margin: 0, fontStyle: 'italic' }}>
                {confidenceReason}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-[1px] self-stretch mx-[20px] shrink-0" style={{ background: v.border }} />

          {/* Right: Segmented donut + legend */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-[14px] flex-1">
            <SegmentedDonut
              positive={sentimentScore}
              neutral={neutralScore}
              negative={negativeScore}
            />
            <div className="text-center sm:text-left">
              <p style={{ fontSize: '0.59rem', fontWeight: 800, color: v.textMid, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Sentiment
              </p>
              {([
                ['Positive', sentimentScore, '#059669'],
                ['Neutral',  neutralScore,   '#94a3b8'],
                ['Negative', negativeScore,  '#f43f5e'],
              ] as [string, number, string][]).map(([label, val, col]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }} className="justify-center sm:justify-start">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, color: v.textDark }}>{val}%</span>
                  <span style={{ fontSize: '0.60rem', color: v.textMid }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. MIXED SIGNALS — gray-purple tint, amber icon only ────────────── */}
      {inconsistencies && inconsistencies.length > 0 && (
        <FloatCard style={{
          marginBottom: GAP,
          // Distinct gray-purple — NOT amber
          background: 'linear-gradient(135deg, rgba(245,243,255,0.95) 0%, rgba(237,233,254,0.70) 100%)',
          border: '1.5px solid rgba(167,139,250,0.30)',
          padding: '16px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {/* Amber warning icon — only accent here */}
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: '#7c3aed', margin: 0 }}>
              Mixed Signals Detected
            </p>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {inconsistencies.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.55rem', fontWeight: 900, color: '#d97706',
                }}>!</span>
                <span style={{ fontSize: '0.80rem', color: '#4c1d95', lineHeight: 1.55, fontWeight: 500 }}>{item}</span>
              </li>
            ))}
          </ul>
        </FloatCard>
      )}

      {/* ── 4. STRENGTHS + COMPLAINTS — equal-height grid ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 items-stretch">

        {/* Strengths — emerald tint */}
        <FloatCard style={{
          background: 'linear-gradient(160deg, rgba(240,253,244,0.95) 0%, rgba(255,255,255,0.80) 100%)',
          border: '1px solid rgba(52,211,153,0.25)',
          borderTop: '3px solid #10b981',
          padding: '22px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: '#059669', margin: 0 }}>
              Top Strengths
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {strengths.map(({ point, percentage, example }, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.81rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35, paddingRight: 8, flex: 1 }}>
                    {point}
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669', flexShrink: 0, letterSpacing: '-0.02em' }}>
                    {percentage}%
                  </span>
                </div>
                <GradientBar
                  pct={percentage}
                  gradient="linear-gradient(90deg, #6ee7b7, #10b981, #059669)"
                  delay={i * 120}
                />
                {example && (
                  <p style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', margin: '6px 0 0', lineHeight: 1.45 }}>
                    e.g. {example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </FloatCard>

        {/* Complaints — rose tint */}
        <FloatCard style={{
          background: 'linear-gradient(160deg, rgba(255,241,242,0.95) 0%, rgba(255,255,255,0.80) 100%)',
          border: '1px solid rgba(251,113,133,0.22)',
          borderTop: '3px solid #f43f5e',
          padding: '22px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#e11d48" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: '#e11d48', margin: 0 }}>
              Top Complaints
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {complaints.map(({ issue, percentage, severity, example }, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.81rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{issue}</span>
                    {severity && <SeverityTag severity={severity} />}
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#e11d48', flexShrink: 0, letterSpacing: '-0.02em' }}>
                    {percentage}%
                  </span>
                </div>
                <GradientBar
                  pct={percentage}
                  gradient={
                    severity === 'Severe'
                      ? 'linear-gradient(90deg, #fda4af, #f43f5e, #e11d48)'
                      : 'linear-gradient(90deg, #fecdd3, #fb7185, #f43f5e)'
                  }
                  delay={i * 120}
                />
                {example && (
                  <p style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', margin: '6px 0 0', lineHeight: 1.45 }}>
                    e.g. {example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </FloatCard>
      </div>

      {/* ── 5. SUGGESTED ACTION — most prominent ────────────────────────────── */}
      <FloatCard style={{
        marginBottom: GAP,
        background: 'linear-gradient(135deg, rgba(238,242,255,0.97) 0%, rgba(237,233,254,0.92) 100%)',
        border: '2px solid rgba(99,102,241,0.30)',
        padding: '22px 24px',
        // Extra prominent shadow for this section
        boxShadow: [
          '0 1px 0 rgba(255,255,255,0.9) inset',
          '0 4px 8px rgba(99,102,241,0.10)',
          '0 12px 32px rgba(99,102,241,0.14)',
          '0 24px 56px rgba(99,102,241,0.07)',
        ].join(', '),
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            flexShrink: 0, width: 44, height: 44, borderRadius: 13,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 16px rgba(99,102,241,0.40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'iconPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',
          }}>
            <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.60rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Suggested Action
            </p>
            <p style={{ fontSize: '0.97rem', fontWeight: 600, color: '#1e1b4b', lineHeight: 1.68, margin: 0 }}>
              {suggestedAction}
            </p>
          </div>
        </div>
      </FloatCard>

      {/* ── 6. FEEDBACK ──────────────────────────────────────────────────────── */}
      {(props.reportId || props.analysisId) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '16px 0 6px', borderTop: '1px solid rgba(226,232,240,0.55)', marginTop: 24,
          flexDirection: 'column'
        }}>
          {feedbackGiven ? (
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              Thanks for your feedback! ✓
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Was this analysis accurate?</span>
              <button onClick={() => handleFeedback('helpful')} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>👍</button>
              <button onClick={() => handleFeedback('not_helpful')} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>👎</button>
            </div>
          )}
          {feedbackError && (
            <span style={{ fontSize: '0.7rem', color: '#e11d48', marginTop: 4 }}>
              Couldn&apos;t save feedback, please try again
            </span>
          )}
        </div>
      )}

      {/* ── 7. FOOTER ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8, padding: '11px 2px 0',
        borderTop: '1px solid rgba(226,232,240,0.55)',
      }}>
        <span style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span>📊 {reviewCount} reviews analysed</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>🔍 {dataSource === 'amazon' ? 'Amazon (via Apify)' : 'Pasted text'}</span>
          {analysisMs && (
            <>
              <span style={{ opacity: 0.35 }}>·</span>
              <span>⚡ AI · {(analysisMs / 1000).toFixed(1)}s</span>
            </>
          )}
        </span>
        {creditsRemaining != null && (
          <span style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 600 }}>
            {creditsRemaining} credit{creditsRemaining !== 1 ? 's' : ''} remaining
          </span>
        )}
      </div>
    </section>
  );
}
