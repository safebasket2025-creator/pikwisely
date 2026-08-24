'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { getPendingInput } from '@/lib/pendingAnalysis';

/* ─── Helpers ────────────────────────────────────────────────── */
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ─── Eye icon ─────────────────────────────────────────────────── */
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
export default function SignUpPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [apiError, setApiError]     = useState('');
  const [success, setSuccess]       = useState(false);   // true = show email-confirm card
  const [verifiedEmail, setVerifiedEmail] = useState(''); // email to resend to
  const [loading, setLoading]       = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [showCpw, setShowCpw]       = useState(false);
  const [hasPendingInput, setHasPendingInput] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining

  const emailRef = useRef<HTMLInputElement>(null);

  // Detect saved pending analysis input from auth-gate redirect
  useEffect(() => {
    const frame = setTimeout(() => {
      if (getPendingInput()) setHasPendingInput(true);
    }, 0);
    return () => clearTimeout(frame);
  }, []);

  const update = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
    setApiError('');
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.email.trim()) errs.email = 'Email address is required.';
    else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.fullName.trim() },
        // After clicking the verification link, land on /login?verified=true
        emailRedirectTo: `${window.location.origin}/login?verified=true`,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
        setApiError('An account with this email already exists. Try logging in instead.');
      } else {
        setApiError(error.message || 'Something went wrong. Please try again.');
      }
      return;
    }

    if (data.user && !data.session) {
      // Email confirmation required — show the confirmation card
      setVerifiedEmail(form.email.trim());
      setSuccess(true);
    } else {
      // Session returned immediately (email confirm disabled) — go to /analyze and restore input
      router.push('/analyze');
      router.refresh();
    }
  };

  const handleResend = async () => {
    if (!verifiedEmail || resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    setResendSent(false);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: verifiedEmail,
      options: { emailRedirectTo: `${window.location.origin}/login?verified=true` },
    });
    setResendLoading(false);
    if (!error) {
      setResendSent(true);
      // 60-second cooldown
      let secs = 60;
      setResendCooldown(secs);
      const timer = setInterval(() => {
        secs -= 1;
        setResendCooldown(secs);
        if (secs <= 0) clearInterval(timer);
      }, 1000);
    }
  };


  return (
    <>
      {/* Floating blobs */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="blob-a" style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'rgba(165,180,252,0.28)', filter: 'blur(70px)', top: -100, left: -80 }} />
        <div className="blob-b" style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: 'rgba(196,181,253,0.22)', filter: 'blur(60px)', top: '8%', right: -50, animationDelay: '1s' }} />
        <div className="blob-a" style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(147,197,253,0.20)', filter: 'blur(65px)', bottom: '4%', left: '18%', animationDelay: '2s' }} />
      </div>

      {/* Page wrapper */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 48px' }}>

        {/* Auth card */}
        <div className="auth-card animate-fade-up">

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <img src="/logo.png" alt="Pikwisely Logo" style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'contain' }} />
              <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Pikwisely</span>
            </Link>
          </div>

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
                  Your input is saved — analyze right after signup
                </p>
              </div>
            </div>
          )}

          {/* Headline */}
          <h1 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center', marginBottom: 28, fontWeight: 400 }}>
            Start analyzing products for free today.
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

          {/* Email-confirmation card (shown after successful signup with email confirm) */}
          {success && (
            <div
              id="email-confirm-card"
              role="status"
              style={{
                background: 'rgba(240,253,244,0.85)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(110,231,183,0.50)',
                borderRadius: 16,
                padding: '24px 20px',
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              {/* Envelope icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(209,250,229,0.80)', border: '1.5px solid rgba(110,231,183,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>

              <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#065f46', marginBottom: 6 }}>
                Check your inbox!
              </p>
              <p style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 400, lineHeight: 1.6, marginBottom: 18 }}>
                We sent a verification link to{' '}
                <strong style={{ fontWeight: 700 }}>{verifiedEmail}</strong>.<br/>
                Click it to activate your account, then log in.
              </p>

              {/* Resend button */}
              <button
                id="resend-email-btn"
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 20px', borderRadius: 10,
                  fontSize: '0.8rem', fontWeight: 600,
                  color: resendSent ? '#059669' : '#065f46',
                  background: resendSent ? 'rgba(209,250,229,0.70)' : 'rgba(255,255,255,0.70)',
                  border: '1.5px solid rgba(110,231,183,0.55)',
                  cursor: resendLoading || resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  opacity: resendLoading || resendCooldown > 0 ? 0.65 : 1,
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  marginBottom: 14,
                }}
              >
                {resendLoading ? (
                  <><span className="spinner spinner-dark" style={{ width: 12, height: 12 }} />Sending…</>
                ) : resendSent ? (
                  <><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Sent!</>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Resend verification email</>
                )}
              </button>

              {/* Log in nudge */}
              <p style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 400 }}>
                Already verified?{' '}
                <Link href="/login" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
                  Log in →
                </Link>
              </p>
            </div>
          )}

          {!success && (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Full Name */}
                  <div>
                    <label htmlFor="signup-name" className="auth-label">Full Name</label>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      className={`auth-input${errors.fullName ? ' error' : ''}`}
                      placeholder="Jane Doe"
                      value={form.fullName}
                      onChange={e => update('fullName', e.target.value)}
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'signup-name-err' : undefined}
                      disabled={loading}
                    />
                    {errors.fullName && <p id="signup-name-err" className="field-error">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                      {errors.fullName}
                    </p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="signup-email" className="auth-label">Email Address</label>
                    <input
                      id="signup-email"
                      ref={emailRef}
                      type="email"
                      autoComplete="email"
                      className={`auth-input${errors.email ? ' error' : ''}`}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'signup-email-err' : undefined}
                      disabled={loading}
                    />
                    {errors.email && <p id="signup-email-err" className="field-error">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                      {errors.email}
                    </p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="signup-password" className="auth-label">Password</label>
                    <div className="password-wrapper">
                      <input
                        id="signup-password"
                        type={showPw ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={`auth-input${errors.password ? ' error' : ''}`}
                        placeholder="Min. 8 characters"
                        value={form.password}
                        onChange={e => update('password', e.target.value)}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'signup-pw-err' : undefined}
                        disabled={loading}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                        <EyeIcon open={showPw} />
                      </button>
                    </div>
                    {errors.password && <p id="signup-pw-err" className="field-error">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                      {errors.password}
                    </p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="signup-confirm" className="auth-label">Confirm Password</label>
                    <div className="password-wrapper">
                      <input
                        id="signup-confirm"
                        type={showCpw ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={`auth-input${errors.confirmPassword ? ' error' : ''}`}
                        placeholder="Re-enter your password"
                        value={form.confirmPassword}
                        onChange={e => update('confirmPassword', e.target.value)}
                        aria-invalid={!!errors.confirmPassword}
                        aria-describedby={errors.confirmPassword ? 'signup-cpw-err' : undefined}
                        disabled={loading}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowCpw(v => !v)} aria-label={showCpw ? 'Hide confirm password' : 'Show confirm password'}>
                        <EyeIcon open={showCpw} />
                      </button>
                    </div>
                    {errors.confirmPassword && <p id="signup-cpw-err" className="field-error">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                      {errors.confirmPassword}
                    </p>}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={loading}
                    style={{ marginTop: 4 }}
                  >
                    {loading ? <><span className="spinner" />Creating account…</> : 'Create Account'}
                  </button>
                </div>
              </form>

              {/* Toggle link */}
              <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
                  Log in
                </Link>
              </p>

              {/* Terms */}
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.73rem', color: '#94a3b8', fontWeight: 400, lineHeight: 1.6 }}>
                By signing up, you agree to our{' '}
                <Link href="#" style={{ color: '#64748b', textDecoration: 'underline', textDecorationColor: 'rgba(100,116,139,0.4)' }}>Terms</Link>
                {' '}&amp;{' '}
                <Link href="#" style={{ color: '#64748b', textDecoration: 'underline', textDecorationColor: 'rgba(100,116,139,0.4)' }}>Privacy Policy</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
