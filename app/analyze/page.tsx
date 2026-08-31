'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getPendingInput, clearPendingInput } from '@/lib/pendingAnalysis';
import AnalysisResult, { type AnalysisResultProps } from '@/components/AnalysisResult';

import AppNavbar from '@/components/AppNavbar';
import type { User } from '@supabase/supabase-js';

export default function AnalyzePage() {
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const ctaBtnRef   = useRef<HTMLButtonElement>(null);
  const router      = useRouter();
  const supabase    = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [reportsUsed, setReportsUsed] = useState<number | null>(null);
  const [reportsLimit, setReportsLimit] = useState<number | null>(null);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResultProps | null>(null);
  const [analyzeError,   setAnalyzeError]   = useState<string>('');
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [tipOpen,        setTipOpen]        = useState(false);
  const [isDownloading,  setIsDownloading]  = useState(false);
  const [downloadError,  setDownloadError]  = useState<string | null>(null);
  const [signingOut, setSigningOut]         = useState(false);
  const [inputTextLength, setInputTextLength] = useState(0);
  const [analyzeWarning, setAnalyzeWarning] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
        supabase.from('profiles').select('reports_used, reports_limit').eq('id', data.user.id).single()
          .then(({ data: profile }) => {
            if (profile) {
              setReportsUsed(profile.reports_used);
              setReportsLimit(profile.reports_limit);
            }
            setAuthLoading(false);
          });
      }
    });
  }, [router, supabase]);

  const triggerAnalyze = async (val: string) => {
    const btn = ctaBtnRef.current;
    if (!btn) return;

    setAnalyzeError('');
    setAnalyzeWarning('');
    setAnalysisResult(null);
    setIsAnalyzing(true);
    btn.disabled = true;

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: val }),
      });

      const data = await res.json() as AnalysisResultProps & { error?: string; code?: string; creditsRemaining?: number; warning?: string };

      if (!res.ok) {
        if (data.code === 'OUT_OF_CREDITS' && reportsLimit !== null) {
          setReportsUsed(reportsLimit);
        }
        throw new Error(data.error ?? `Error ${res.status}`);
      }

      setAnalysisResult(data);
      if (data.warning) setAnalyzeWarning(data.warning);
      if (data.creditsRemaining !== undefined && data.creditsRemaining !== null && reportsLimit !== null && reportsLimit !== -1) {
        setReportsUsed(reportsLimit - data.creditsRemaining);
      }

      setTimeout(() => {
        document.getElementById('live-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setAnalyzeError(msg);
    } finally {
      setIsAnalyzing(false);
      btn.disabled = false;
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    const pending = getPendingInput();
    if (pending && inputRef.current) {
      inputRef.current.value = pending;
      clearPendingInput();
      const t = setTimeout(() => triggerAnalyze(pending), 120);
      return () => clearTimeout(t);
    }
  }, [authLoading]);

  const remainingCredits = (reportsLimit !== null && reportsUsed !== null) 
    ? (reportsLimit === -1 ? 9999 : reportsLimit - reportsUsed) 
    : null;
  const isOutOfCredits = remainingCredits !== null && remainingCredits <= 0;

  const handleAnalyze = async () => {
    if (isOutOfCredits) return;
    
    const input = inputRef.current;
    const btn   = ctaBtnRef.current;
    if (!input || !btn) return;
    const val = input.value.trim();

    if (!val) {
      input.focus();
      input.style.borderColor = 'rgba(239,68,68,0.55)';
      input.style.boxShadow   = '0 0 0 4px rgba(239,68,68,0.10)';
      input.placeholder       = 'Please paste some reviews first…';
      setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow   = '';
        input.placeholder       = 'Paste your product reviews here — one review per line works best';
      }, 2200);
      return;
    }

    triggerAnalyze(val);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const downloadPdf = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const verifyRes = await fetch('/api/verify-pdf', { method: 'POST' });
      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json().catch(() => ({}));
        throw new Error(verifyData.error || 'You must upgrade to download PDFs.');
      }

      const element = document.getElementById('report-capture-area');
      if (!element) throw new Error('Report element not found');

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.setTextColor(150);
      pdf.setFontSize(10);
      pdf.text('Powered by Pikwisely', pdfWidth - 45, 8);

      pdf.addImage(imgData, 'PNG', 0, position + 12, pdfWidth, imgHeight);
      heightLeft -= (pdfHeight - 12);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeName = analysisResult?.productName 
        ? analysisResult.productName.replace(/[^a-z0-9]/gi, '_').substring(0, 30) 
        : new Date().toISOString().split('T')[0];
        
      pdf.save(`Pikwisely-Report-${safeName}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      setDownloadError("Couldn't generate PDF — please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366f1' }}></span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <AppNavbar />

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px 80px' }}>
        
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: 32, letterSpacing: '-0.02em', textAlign: 'center' }}>
          Analyze Reviews
        </h1>

        <div className="glass-strong animate-fade-up" style={{ width: '100%', maxWidth: 720, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <textarea
                id="analysis-input"
                ref={inputRef}
                placeholder="Paste your product reviews here — one review per line works best"
                rows={5}
                style={{ width: '100%', padding: '16px', borderRadius: 14, fontSize: '0.95rem', fontWeight: 500, color: '#334155', background: 'rgba(255,255,255,0.72)', border: '1.5px solid rgba(255,255,255,0.82)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s', resize: 'vertical', minHeight: 140, boxSizing: 'border-box' }}
                autoComplete="off"
                spellCheck={false}
                onChange={e => setInputTextLength(e.target.value.length)}
                onFocus={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.12), 0 4px 20px rgba(99,102,241,0.10)'; }}
                onBlur={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.72)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.82)'; e.currentTarget.style.boxShadow = ''; }}
              />
            </div>
            
            {inputTextLength > 8000 && (
              <div className="animate-fade-in" style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(254,243,199,0.7)', border: '1px solid rgba(253,230,138,0.9)', fontSize: '0.85rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span style={{ fontWeight: 500 }}>Large input detected — for best results, consider pasting 100-150 reviews at a time.</span>
              </div>
            )}

            {/* Credit Counter */}
            {reportsLimit !== null && reportsUsed !== null && remainingCredits !== null && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-[10px_14px] rounded-xl bg-white/70 border border-slate-200/80 text-[0.85rem] font-semibold">
                <div className="flex flex-col sm:flex-row items-center gap-[10px] text-center sm:text-left">
                  <span style={{
                    padding: '3px 10px', borderRadius: 8, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: reportsLimit === 3 ? '#f1f5f9' : reportsLimit >= 150 ? '#f3e8ff' : '#e0e7ff',
                    color: reportsLimit === 3 ? '#64748b' : reportsLimit >= 150 ? '#7e22ce' : '#4338ca',
                    border: `1px solid ${reportsLimit === 3 ? '#cbd5e1' : reportsLimit >= 150 ? '#d8b4fe' : '#a5b4fc'}`
                  }}>
                    {reportsLimit === 3 ? 'Free' : reportsLimit >= 150 ? 'Pro' : 'Starter'}
                  </span>
                  
                  <span style={{ 
                    color: isOutOfCredits ? '#ef4444' : remainingCredits <= 3 ? '#d97706' : '#64748b',
                  }}>
                    {isOutOfCredits ? (
                      "0 reports remaining — upgrade to continue"
                    ) : (
                      `${reportsLimit === -1 ? 'Unlimited' : remainingCredits} reports remaining this month`
                    )}
                  </span>
                </div>
                
                {isOutOfCredits && (
                  <Link href="/pricing" style={{ 
                    padding: '6px 12px', borderRadius: 8, background: '#ef4444', color: '#fff', 
                    fontSize: '0.75rem', textDecoration: 'none', fontWeight: 700, transition: 'background 0.2s' 
                  }} onMouseEnter={e => e.currentTarget.style.background = '#dc2626'} onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}>
                    Upgrade Plan
                  </Link>
                )}
              </div>
            )}

            <button
              id="cta-btn"
              ref={ctaBtnRef}
              type="button"
              onClick={handleAnalyze}
              disabled={isOutOfCredits}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 text-base bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isOutOfCredits ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isAnalyzing ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8V4"/>
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  Analyze Now
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </>
              )}
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <button
                id="copy-tip-toggle"
                type="button"
                aria-expanded={tipOpen}
                aria-controls="copy-tip-body"
                onClick={() => setTipOpen(o => !o)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 600,
                  color: '#6366f1', fontFamily: 'inherit',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#4f46e5')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6366f1')}
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  aria-hidden="true"
                  style={{
                    transition: 'transform 0.25s ease',
                    transform: tipOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
                How to copy reviews
              </button>

              <a
                href="https://youtu.be/n2CeIIGuadg?si=G_AwrfDFeq4YGHg2"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  textDecoration: 'none',
                  padding: '4px 6px', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 600,
                  color: '#6366f1', fontFamily: 'inherit',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#4f46e5')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6366f1')}
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Watch Demo
              </a>
            </div>

            <div
              id="copy-tip-body"
              role="region"
              aria-hidden={!tipOpen}
              style={{
                overflow: 'hidden',
                maxHeight: tipOpen ? 320 : 0,
                opacity: tipOpen ? 1 : 0,
                transition: 'max-height 0.35s ease, opacity 0.25s ease',
              }}
            >
              <div style={{
                marginTop: 8,
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.18)',
                fontSize: '0.85rem',
                lineHeight: 1.65,
                color: '#475569',
              }}>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#4f46e5', marginBottom: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                    On mobile
                  </span><br/>
                  Open the product in your phone&apos;s <strong>browser</strong> (not the app) → scroll to <strong>Reviews</strong> → tap &amp; hold on the review text → drag to select → tap <strong>Copy</strong> → paste here.
                </div>
                <div style={{ borderTop: '1px solid rgba(99,102,241,0.15)', paddingTop: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#4f46e5', marginBottom: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20"/></svg>
                    On desktop
                  </span><br/>
                  Select review text on the page, copy, and paste here.
                </div>
              </div>
            </div>
          </div>

          {analyzeError && (
            <div role="alert" style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '14px 18px', borderRadius: 14, background: 'rgba(254,226,226,0.82)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(252,165,165,0.50)' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <p style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 500, margin: 0, flex: 1 }}>{analyzeError}</p>
              <button onClick={() => setAnalyzeError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '1.2rem', lineHeight: 1, padding: 0 }} aria-label="Dismiss error">×</button>
            </div>
          )}
        </div>

        {/* Empty state before analysis */}
        {!analysisResult && !isAnalyzing && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: 12 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500, margin: 0 }}>Paste your reviews above and click Analyze to see your report here.</p>
          </div>
        )}

        {/* Loading state */}
        {isAnalyzing && (
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="glass-strong" style={{ width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)' }}>
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8V4"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#4f46e5', fontWeight: 600 }}>Analyzing reviews with AI...</p>
          </div>
        )}

        {/* Result */}
        {analysisResult && (
          <div id="live-result" className="animate-fade-up" style={{ width: '100%', maxWidth: 900, marginTop: 32 }}>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-5 flex-wrap gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  Your Analysis Report
                </h2>
                {downloadError && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, background: '#fee2e2', padding: '2px 8px', borderRadius: 4 }}>
                    {downloadError}
                  </span>
                )}
              </div>
              
              <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center gap-3">
                {reportsLimit === 3 ? (
                  <div className="relative group w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.preventDefault(); router.push('/pricing'); }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base bg-slate-50 text-slate-400 font-medium border border-slate-200 rounded-lg shadow-sm transition-all focus:outline-none hover:bg-slate-100"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      Download PDF
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-active:block w-max max-w-xs bg-slate-800 text-white text-xs px-3 py-2 rounded text-center shadow-lg z-10 pointer-events-none">
                      Upgrade to Starter or Pro to download reports as PDF
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={downloadPdf}
                    disabled={isDownloading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base bg-white/80 backdrop-blur-md text-indigo-600 font-medium border border-indigo-200 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-indigo-50 active:scale-95"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Download PDF
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => { setAnalysisResult(null); if (inputRef.current) inputRef.current.value = ''; }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base bg-white/80 backdrop-blur-md text-indigo-600 font-medium border border-indigo-200 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-indigo-50 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  New Analysis
                </button>
              </div>
            </div>
            
            {analyzeWarning && (
              <div className="animate-fade-up" style={{ marginBottom: 24, padding: '14px 18px', borderRadius: 14, background: 'rgba(254,243,199,0.7)', border: '1px solid rgba(253,230,138,0.9)', fontSize: '0.9rem', color: '#b45309', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{analyzeWarning}</p>
              </div>
            )}

            <div id="report-capture-area" style={{ padding: '8px', background: '#f8fafc', borderRadius: '24px', margin: '-8px' }}>
              <AnalysisResult {...analysisResult} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
