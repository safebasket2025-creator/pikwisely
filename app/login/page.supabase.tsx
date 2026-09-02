'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { getPendingInput } from '@/lib/pendingAnalysis';

/* ─── Helpers ─────────────────────────────────────────────────── */
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
    </svg>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
function LoginContent() {
  const router   = useRouter();
  const supabase = createClient();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [apiError, setApiError]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [hasPendingInput, setHasPendingInput] = useState(false);
  const [isVerified, setIsVerified]           = useState(false);

  const searchParams = useSearchParams();

  // Detect saved pending analysis input from auth-gate redirect
  useEffect(() => {
    // Wrapped in setTimeout(0) to defer state updates out of the effect body
    // to avoid the react-hooks/set-state-in-effect lint warning.
    const frame = setTimeout(() => {
      if (getPendingInput()) setHasPendingInput(true);
      // Show verified banner when redirected from email confirmation link
      if (searchParams.get('verified') === 'true') {
        setIsVerified(true);
        // Clean the param from the URL without a page reload
        const url = new URL(window.location.href);
        url.searchParams.delete('verified');
        window.history.replaceState({}, '', url.toString());
      }
    }, 0);
    return () => clearTimeout(frame);
  }, [searchParams]);

  const clearFieldError = (key: string) => {
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
    setApiError('');
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!isValidEmail(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      if (
        error.message.toLowerCase().includes('invalid login') ||
        error.message.toLowerCase().includes('invalid credentials') ||
        error.message.toLowerCase().includes('wrong password') ||
        error.message.toLowerCase().includes('user not found')
      ) {
        setApiError('Incorrect email or password. Please try again.');
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        setApiError('Please verify your email address before logging in. Check your inbox.');
      } else {
        setApiError(error.message || 'Something went wrong. Please try again.');
      }
      return;
    }

    // Redirect to /analyze so the pending-input restore logic can fire
    router.push('/analyze');
    router.refresh();
  };


  return (
    <>
      {/* Floating blobs */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="blob-a" style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'rgba(165,180,252,0.28)', filter: 'blur(70px)', top: -100, left: -80 }} />
        <div className="blob-b" style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: 'rgba(196,181,253,0.22)', filter: 'blur(60px)', top: '8%', right: -50, animationDelay: '1s' }} />
        <div className="blob-a" style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(167,139,250,0.18)', filter: 'blur(60px)', bottom: '8%', right: '8%', animationDelay: '0.5s' }} />
      </div>

      {/* Page wrapper */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 48px' }}>

        <div className="auth-card animate-fade-up">

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <img src="/logo.png" alt="Pikwisely Logo" style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'contain' }} />
              <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Pikwisely</span>
            </Link>
          </div>

          {/* Email-verified success banner */}
          {isVerified && (
            <div
              id="email-verified-banner"
              role="status"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 14,
                background: 'rgba(240,253,244,0.88)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(110,231,183,0.55)',
                boxShadow: '0 2px 14px rgba(16,185,129,0.10)',
                marginBottom: 20,
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5" style={{ flexShrink: 0 }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#065f46', marginBottom: 1 }}>
                  Email verified!
                </p>
                <p style={{ fontSize: '0.75rem', fontWeight: 400, color: '#047857', margin: 0 }}>
                  Log in below to continue to your analysis.
                </p>
              </div>
            </div>
          )}

          {/* Pending-analysis glass banner */}
          {hasPendingInput && (
            <div
              id="pending-input-banner"
              role="status"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 14,
                background: 'rgba(238,242,255,0.82)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(165,180,252,0.50)',
                boxShadow: '0 2px 14px rgba(99,102,241,0.10)',
                marginBottom: 20,
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3730a3', marginBottom: 2 }}>
                  Sign up to get your free analysis
                </p>
                <p style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6366f1', margin: 0 }}>
                  Your input is saved — analyze right after login
                </p>
              </div>
            </div>
          )}

          {/* Headline */}
          <h1 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center', marginBottom: 28, fontWeight: 400 }}>
            Sign in to your Pikwisely account.
          </p>

          {/* API error */}
          {apiError && (
            <div className="auth-error" role="alert" style={{ marginBottom: 20 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              {apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Email */}
              <div>
                <label htmlFor="login-email" className="auth-label">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className={`auth-input${errors.email ? ' error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearFieldError('email'); }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'login-email-err' : undefined}
                  disabled={loading}
                />
                {errors.email && <p id="login-email-err" className="field-error">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  {errors.email}
                </p>}
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label htmlFor="login-password" className="auth-label" style={{ margin: 0 }}>Password</label>
                  <Link
                    href="/forgot-password"
                    style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.01em' }}
                    tabIndex={0}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="password-wrapper">
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`auth-input${errors.password ? ' error' : ''}`}
                    placeholder="Your password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearFieldError('password'); }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'login-pw-err' : undefined}
                    disabled={loading}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                {errors.password && <p id="login-pw-err" className="field-error">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  {errors.password}
                </p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="auth-btn-primary"
                disabled={loading}
                style={{ marginTop: 4 }}
              >
                {loading ? <><span className="spinner" />Signing in…</> : 'Log In'}
              </button>
            </div>
          </form>

          {/* Toggle link */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

/* Wrap in Suspense — required by Next.js App Router when using useSearchParams */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
