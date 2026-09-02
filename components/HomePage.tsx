'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import FAQ from './FAQ';

export default function HomePage() {
  const router      = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {    // Scroll-reveal for sections
    const revealEls = document.querySelectorAll<HTMLElement>('.reveal');
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const delay = parseInt((entry.target as HTMLElement).dataset.delay || '0', 10);
            setTimeout(() => entry.target.classList.add('revealed'), delay);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(el => obs.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('revealed'));
    }

    // Animated sentiment ring
    function animateRing() {
      const ring  = document.getElementById('sentiment-ring-fill') as SVGCircleElement | null;
      const label = document.getElementById('sentiment-pct-label');
      if (!ring || !label) return;
      const target = 78;
      const circumference = 2 * Math.PI * 54;
      ring.style.strokeDasharray  = String(circumference);
      ring.style.strokeDashoffset = String(circumference);
      let current = 0;
      const step = () => {
        current = Math.min(current + 1.2, target);
        ring.style.strokeDashoffset = String(circumference - (current / 100) * circumference);
        label.textContent = Math.round(current) + '%';
        if (current < target) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    const ringSection = document.getElementById('sample-report');
    if (ringSection) {
      const ro = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { animateRing(); ro.disconnect(); }
      }, { threshold: 0.15 });
      ro.observe(ringSection);
    }
  }, []);

  const handleStartAnalyzing = async () => {
    if (!isSignedIn) {
      router.push('/sign-up');
    } else {
      router.push('/analyze');
    }
  };


  const handleScrollToReport = () => {
    const section = document.getElementById('sample-report');
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main>
      {/* ─── HERO ───────────────────────────────────────────────── */}
      <section id="hero" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '140px 24px 40px', textAlign: 'center' }}>

        {/* Eyebrow badge */}
        <div className="badge-pill animate-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 9999, marginBottom: 32 }}>
          <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
            <span style={{ position: 'absolute', display: 'inline-flex', width: '100%', height: '100%', borderRadius: '50%', background: '#6366f1', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
          </span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4338ca', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI-Powered Review Intelligence</span>
        </div>

        {/* Headline */}
        <div className="animate-fade-up-2" style={{ maxWidth: 700, margin: '0 auto 20px' }}>
          <h1 style={{ fontSize: 'clamp(2.8rem,7vw,4.5rem)', fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.03em', color: '#0f172a' }}>
            Know Before<br/><span className="headline-accent">You Sell.</span>
          </h1>
        </div>

        {/* Subheadline */}
        <div className="animate-fade-up-3" style={{ maxWidth: 500, margin: '0 auto 40px' }}>
          <p style={{ fontSize: 'clamp(1rem,2.5vw,1.125rem)', color: '#64748b', fontWeight: 400, lineHeight: 1.7 }}>
            Paste your product reviews and get a full AI&nbsp;analysis in&nbsp;seconds.
            Understand what your customers <em>really</em> think.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="animate-fade-up-4 w-full max-w-[680px] flex flex-col sm:flex-row items-center justify-center gap-3 mb-[48px]">
          <button
            type="button"
            onClick={handleStartAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center text-center gap-2 px-8 py-3.5 text-base bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span>Start Analyzing</span>
            <svg className="w-5 h-5 ml-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>

          <button
            id="see-sample-btn"
            type="button"
            onClick={handleScrollToReport}
            className="w-full sm:w-auto flex items-center justify-center text-center gap-2 px-8 py-3.5 text-base bg-white text-indigo-600 font-medium border border-indigo-100 rounded-full shadow-sm hover:bg-indigo-50 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Scroll to sample analysis report"
          >
            <svg className="w-5 h-5 text-indigo-500 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>See Sample Report</span>
            <svg className="w-4 h-4 text-gray-400 ml-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Feature chips */}
        <div className="animate-fade-up-5" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 660, margin: '0 auto 56px' }}>
          {[
            { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Sentiment Breakdown' },
            { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Instant AI Report' },
            { icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', label: 'Pro/Con Highlights' },
            { icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z', label: 'Competitor Insights' },
            { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', label: 'Export PDF Report' },
          ].map(chip => (
            <div key={chip.label} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 9999 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={chip.icon}/>
              </svg>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{chip.label}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="glass animate-fade-up-5" style={{ 
          width: '100%', maxWidth: 480, borderRadius: 20, padding: '20px 24px', margin: '0 auto',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(240,240,250,0.6) 100%)',
          boxShadow: '0 15px 35px -5px rgba(99,102,241,0.15), 0 5px 15px -5px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.05)',
          border: '1px solid rgba(255,255,255,0.8)',
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease'
        }}
        onMouseEnter={e => { 
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px) rotateX(4deg) rotateY(-2deg)'; 
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 25px 45px -10px rgba(99,102,241,0.25), 0 10px 20px -5px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.05)'; 
        }}
        onMouseLeave={e => { 
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)'; 
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 15px 35px -5px rgba(99,102,241,0.15), 0 5px 15px -5px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.05)'; 
        }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0" style={{ transform: 'translateZ(10px)' }}>
            {[
              { prefix: '1K', suffix: '+', label: 'Products Analyzed', border: true },
              { prefix: '98', suffix: '%', label: 'Accuracy Rate', border: true },
              { prefix: '<5', suffix: 's', label: 'Avg. Analysis', border: false },
            ].map(stat => (
              <div key={stat.label} className={`text-center px-4 ${stat.border ? 'sm:border-r border-white/55' : ''} ${!stat.border && stat.label === 'Products Analyzed' ? 'border-b sm:border-b-0 border-white/55 pb-3 mb-3 sm:pb-0 sm:mb-0' : ''}`}>
                <p style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: 4 }}>
                  {stat.prefix}<span style={{ color: '#6366f1' }}>{stat.suffix}</span>
                </p>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

      </section>



      {/* ─── THIS VS THAT ───────────────────────────────────────── */}
      <section id="comparison" style={{ position: 'relative', zIndex: 10, padding: '20px 24px 60px' }}>
        <div className="reveal" data-delay="0" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 4px 16px rgba(99,102,241,0.09)', marginBottom: 20 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4338ca', letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Difference</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Reading Reviews vs. Pikwisely</h2>
        </div>

        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }} className="md:flex-row md:items-stretch">
          
          {/* Without Pikwisely (Left Column) */}
          <div className="reveal flex-1 order-2 md:order-1" data-delay="80"
            style={{
              background: 'rgba(248,250,252,0.60)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(226,232,240,0.80)',
              borderRadius: 24,
              padding: '40px 32px',
            }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#64748b', marginBottom: 24, borderBottom: '1px solid rgba(226,232,240,0.80)', paddingBottom: 16 }}>
              <span style={{ marginRight: 8 }}>😓</span> Reading Reviews Yourself
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '⏱️', text: '1-2 hours reading through reviews' },
                { icon: '🎯', text: 'Only remember the last few you read' },
                { icon: '❓', text: 'No way to calculate real complaint percentages' },
                { icon: '😵', text: 'Miss contradictions and hidden patterns' },
                { icon: '💸', text: 'Risk sourcing a product based on gut feeling' }
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.95rem', color: '#64748b', lineHeight: 1.5 }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* With Pikwisely (Right Column) */}
          <div className="reveal flex-1 order-1 md:order-2 relative" data-delay="160"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              border: '2px solid rgba(99,102,241,0.3)',
              borderRadius: 24,
              padding: '40px 32px',
              boxShadow: '0 20px 48px rgba(99,102,241,0.15)',
            }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 16px', borderRadius: 9999, background: 'linear-gradient(135deg,#4f46e5,#6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.40)', whiteSpace: 'nowrap' }}>
              <svg width="11" height="11" fill="#fff" viewBox="0 0 20 20" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recommended</span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 24, borderBottom: '1px solid rgba(226,232,240,0.80)', paddingBottom: 16 }}>
              <span style={{ marginRight: 8 }}>⚡</span> Pikwisely
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '⏱️', text: 'Full report in under 5 seconds' },
                { icon: '🎯', text: 'Every review analyzed, nothing missed' },
                { icon: '📊', text: 'Exact percentage breakdown of every complaint' },
                { icon: '🔍', text: 'Contradictions and mixed signals flagged automatically' },
                { icon: '✅', text: 'Source with data-backed confidence' }
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.95rem', color: '#0f172a', fontWeight: 500, lineHeight: 1.5 }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="reveal" data-delay="240" style={{ textAlign: 'center', marginTop: 48 }}>
          <button 
            onClick={handleStartAnalyzing} 
            className="btn-primary" 
            style={{ fontSize: '1rem', padding: '16px 36px', borderRadius: 16 }}
          >
            Try It Free
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </button>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 10, padding: '40px 24px 96px' }}>
        <div className="reveal" data-delay="0" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 4px 16px rgba(99,102,241,0.09)', marginBottom: 20 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4338ca', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Simple &amp; Fast</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>How It Works</h2>
          <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: 380, margin: '0 auto', lineHeight: 1.65 }}>Three steps. Under five seconds. That&apos;s it.</p>
        </div>

        <div className="reveal" data-delay="80" style={{ maxWidth: 940, margin: '0 auto', position: 'relative' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: '1', title: '1. Paste Reviews', desc: 'Copy reviews from any product page and paste them in.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { step: '2', title: '2. AI Analyzes', desc: 'Our model reads every review in seconds.', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              { step: '3', title: '3. Get Your Report', desc: 'Instant insights: sentiment, strengths, complaints.', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            ].map(card => (
              <div key={card.step}
                style={{ background: 'rgba(255,255,255,0.50)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 20, boxShadow: '0 6px 32px rgba(99,102,241,0.09)', padding: '32px 24px 28px', textAlign: 'center', transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 44px rgba(99,102,241,0.16)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 32px rgba(99,102,241,0.09)'; }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: 'rgba(238,242,255,0.80)', border: '1.5px solid rgba(165,180,252,0.50)', fontSize: '0.72rem', fontWeight: 800, color: '#4338ca', marginBottom: 20 }}>{card.step}</div>
                <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px', background: 'linear-gradient(135deg,rgba(238,242,255,0.90),rgba(237,233,254,0.75))', border: '1.5px solid rgba(165,180,252,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={card.icon}/></svg>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>{card.title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500, lineHeight: 1.55, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        `}</style>
      </section>

      {/* ─── SAMPLE REPORT ──────────────────────────────────────── */}
      <section id="sample-report" style={{ position: 'relative', zIndex: 10, padding: '80px 24px 100px' }}>
        <div className="reveal" data-delay="0" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 4px 16px rgba(99,102,241,0.09)', marginBottom: 20 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4338ca', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sample Analysis Report</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>See exactly what you&apos;ll get</h2>
          <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: 420, margin: '0 auto', lineHeight: 1.65 }}>Every analysis produces a structured report like this — ready in under 5 seconds.</p>
        </div>

        <div className="reveal" data-delay="80" style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(30px) saturate(180%)', WebkitBackdropFilter: 'blur(30px) saturate(180%)', border: '1px solid rgba(255,255,255,0.80)', borderRadius: 24, boxShadow: '0 12px 56px rgba(99,102,241,0.13)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(226,232,240,0.70)', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ width: 72, height: 72, borderRadius: 14, flexShrink: 0, background: 'linear-gradient(135deg,#e0e7ff,#ede9fe)', border: '1.5px solid rgba(255,255,255,0.80)', boxShadow: '0 4px 14px rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#prodGrad)" opacity="0.20"/>
                  <path d="M7 8h10M7 12h7M7 16h5" stroke="url(#prodGrad)" strokeWidth="1.8" strokeLinecap="round"/>
                  <defs><linearGradient id="prodGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#a78bfa"/></linearGradient></defs>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Product Analyzed</p>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 6, lineHeight: 1.3 }}>boAt Rockerz 450 Bluetooth<br/>On-Ear Headphone</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 9999, background: 'rgba(209,250,229,0.70)', border: '1.5px solid rgba(52,211,153,0.40)', fontSize: '0.72rem', fontWeight: 700, color: '#065f46' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />Strong Opportunity
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 9999, background: 'rgba(224,231,255,0.70)', border: '1.5px solid rgba(129,140,248,0.35)', fontSize: '0.72rem', fontWeight: 700, color: '#3730a3' }}>High Confidence</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left col */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Sentiment ring */}
                <div style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(99,102,241,0.07)' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Customer Sentiment</p>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(226,232,240,0.80)" strokeWidth="9"/>
                        <circle id="sentiment-ring-fill" cx="60" cy="60" r="54" fill="none" stroke="url(#ringGrad)" strokeWidth="9" strokeLinecap="round" style={{ strokeDasharray: 339.3, strokeDashoffset: 339.3 }}/>
                        <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#34d399"/></linearGradient></defs>
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span id="sentiment-pct-label" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>0%</span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>Positive</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[{ label: 'Positive', pct: 78, color: '#10b981' }, { label: 'Neutral', pct: 13, color: '#f59e0b' }, { label: 'Negative', pct: 9, color: '#ef4444' }].map(bar => (
                        <div key={bar.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#374151' }}>{bar.label}</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: bar.color }}>{bar.pct}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'rgba(226,232,240,0.8)' }}>
                            <div style={{ height: '100%', width: `${bar.pct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${bar.color}cc, ${bar.color})` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Suggested action */}
                <div style={{ background: 'linear-gradient(135deg,rgba(238,242,255,0.80),rgba(237,233,254,0.65))', border: '1.5px solid rgba(165,180,252,0.45)', borderRadius: 16, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4338ca', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Suggested Action</p>
                  </div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 500, color: '#1e1b4b', lineHeight: 1.6, margin: 0 }}>
                    Prioritize <strong>packaging improvements</strong> and add a <strong>sizing guide</strong> to your listing.
                  </p>
                </div>
              </div>

              {/* Right col */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Complaints */}
                <div style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 16, padding: 18 }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Top Complaints</p>
                  {[{ label: 'Sizing issues', pct: '22%', bg: 'rgba(254,226,226,0.60)', border: 'rgba(252,165,165,0.40)', color: '#991b1b', pctColor: '#dc2626' }, { label: 'Packaging damage', pct: '18%', bg: 'rgba(254,226,226,0.60)', border: 'rgba(252,165,165,0.40)', color: '#991b1b', pctColor: '#dc2626' }, { label: 'Connectivity drops', pct: '11%', bg: 'rgba(254,243,199,0.60)', border: 'rgba(253,211,77,0.40)', color: '#92400e', pctColor: '#d97706' }].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', borderRadius: 10, background: item.bg, border: `1px solid ${item.border}`, marginBottom: 8 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: item.color }}>{item.label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: item.pctColor }}>{item.pct}</span>
                    </div>
                  ))}
                </div>
                {/* Strengths */}
                <div style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 16, padding: 18 }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Top Strengths</p>
                  {[{ label: 'Great battery life', pct: '31%' }, { label: 'Sound quality', pct: '27%' }, { label: 'Comfortable fit', pct: '19%' }].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', borderRadius: 10, background: 'rgba(209,250,229,0.60)', border: '1px solid rgba(110,231,183,0.40)', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#065f46' }}>{item.label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>{item.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 28px', borderTop: '1px solid rgba(226,232,240,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, background: 'rgba(248,250,252,0.50)' }}>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, margin: 0 }}>Based on <strong style={{ color: '#64748b' }}>842 reviews</strong>&nbsp;•&nbsp;Scraped Aug 19, 2026&nbsp;•&nbsp;Amazon.in</p>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', background: 'rgba(238,242,255,0.80)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(165,180,252,0.35)' }}>AI Generated</span>
            </div>
          </div>
        </div>

        {/* Bottom nudge */}
        <div className="reveal" data-delay="160" style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500, marginBottom: 16 }}>
            Your report will look just like this — for any product you paste reviews from.
          </p>
          <Link
            href="#hero"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 30px', borderRadius: 14, fontSize: '0.92rem', fontWeight: 700, color: '#fff', textDecoration: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', boxShadow: '0 6px 22px rgba(99,102,241,0.35)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 32px rgba(99,102,241,0.48)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 22px rgba(99,102,241,0.35)'; }}
          >
            Generate My Report
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </Link>
        </div>

        <style>{`
          }
        `}</style>
      </section>

      <FAQ />

      {/* ─── FINAL CTA ──────────────────────────────────────────── */}
      <section id="final-cta" style={{ position: 'relative', zIndex: 10, padding: '80px 24px 96px', textAlign: 'center' }}>
        <div className="reveal" data-delay="0" style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="relative overflow-hidden rounded-[28px] border-[1.5px] border-indigo-300/40 shadow-[0_16px_60px_rgba(99,102,241,0.14)] p-10 sm:px-12 sm:py-15" style={{ background: 'linear-gradient(150deg,rgba(255,255,255,0.68) 0%,rgba(238,242,255,0.55) 100%)', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)' }}>
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(165,180,252,0.20)', filter: 'blur(55px)', top: -60, right: -40 }} />
              <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(196,181,253,0.18)', filter: 'blur(50px)', bottom: -50, left: -30 }} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.9rem,5vw,3rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 16, position: 'relative' }}>
              Stop guessing.<br/><span className="headline-accent">Start with data.</span>
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: 400, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 36px', position: 'relative' }}>
              Paste your product reviews and get a full AI analysis — free, in under five seconds.
            </p>
            <Link
              href="#hero"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '16px 36px', borderRadius: 15, fontSize: '1rem', fontWeight: 800, color: '#fff', textDecoration: 'none', background: 'linear-gradient(135deg,#4f46e5 0%,#6366f1 100%)', border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 6px 24px rgba(99,102,241,0.40)', transition: 'transform 0.22s, box-shadow 0.22s, background 0.22s', position: 'relative' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,#4338ca 0%,#4f46e5 100%)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 38px rgba(99,102,241,0.52)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,#4f46e5 0%,#6366f1 100%)'; (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(99,102,241,0.40)'; }}
            >
              Try Pikwisely Free
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </Link>
            <p style={{ marginTop: 20, fontSize: '0.76rem', color: '#94a3b8', fontWeight: 500, position: 'relative' }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2.5" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              No credit card&nbsp;·&nbsp;Free forever on the Free plan&nbsp;·&nbsp;Cancel anytime
            </p>
          </div>
        </div>

        <style>{`
        `}</style>
      </section>
    </main>
  );
}
