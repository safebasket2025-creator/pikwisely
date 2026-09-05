'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/nextjs';
import { createClerkSupabaseClient } from '@/lib/supabase-clerk';
import UserDropdown from './UserDropdown';

interface NavbarProps {
  /** Pass 'pricing' to highlight the Pricing link as active */
  activePage?: 'home' | 'pricing';
}

export default function Navbar({ activePage }: NavbarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Track scroll for navbar appearance
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Get current session
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && user) {
        getToken({ template: 'supabase' }).then(token => {
          const supabase = createClerkSupabaseClient(token);
          supabase.from('profiles').select('*').eq('id', user.id).single()
            .then(({ data: p }) => {
              setProfile(p);
              setLoading(false);
            });
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, user, getToken]);

  const [dismissedBanner, setDismissedBanner] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push('/');
    router.refresh();
  };

  const dismissExpiryBanner = async () => {
    setDismissedBanner(true);
    try {
      await fetch('/api/user/dismiss-expiry', { method: 'POST' });
    } catch (e) {
      console.error('Failed to dismiss banner', e);
    }
  };

  const isPricing = activePage === 'pricing' || pathname === '/pricing';
  const showBanner = profile?.notified_plan_expiry && !dismissedBanner;

  return (
    <>
      {showBanner && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 flex justify-between items-center text-amber-900 text-sm font-medium z-[60] relative mt-16 sm:mt-0">
          <div className="max-w-[1152px] mx-auto w-full flex justify-between items-center px-[1.5rem]">
            <span>Your Paid plan has expired. You're now on the Free plan — upgrade again to continue with more reports.</span>
            <button onClick={dismissExpiryBanner} className="ml-4 text-amber-900 hover:text-amber-700 font-bold text-lg leading-none">&times;</button>
          </div>
        </div>
      )}
      <nav
        id="navbar"
      style={{
        position: showBanner ? 'sticky' : 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.72)',
        boxShadow: scrolled
          ? '0 2px 24px rgba(99,102,241,0.11)'
          : '0 1px 16px rgba(99,102,241,0.06)',
        transition: 'box-shadow 0.3s ease, background 0.3s ease',
      }}
    >
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }} aria-label="Pikwisely home">
            <img src="/logo.png" alt="Pikwisely Logo" style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'contain' }} />
            <span className="logo-text" style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Pikwisely</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <Link href="/#how-it-works" className="nav-link">How it works</Link>
            <Link href="/#sample-report" className="nav-link">Features</Link>
            <Link
              href="/pricing"
              className={`nav-link${isPricing ? ' active' : ''}`}
              aria-current={isPricing ? 'page' : undefined}
            >
              Pricing
            </Link>
            <a href="https://youtu.be/n2CeIIGuadg?si=A4dC_XTWVLWZKq6P" target="_blank" rel="noopener noreferrer" className="nav-link">
              Watch Demo
            </a>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/analyze"
                      style={{
                        padding: '8px 16px', borderRadius: 10,
                        fontSize: '0.82rem', fontWeight: 600, color: '#fff',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
                      }}
                    >
                      Go to App
                    </Link>
                    
                    <UserDropdown 
                      user={user} 
                      profile={profile} 
                      onSignOut={handleSignOut} 
                      signingOut={signingOut} 
                    />
                  </>
                ) : (
                  <>
                    <Link href="/sign-in" className="hidden md:block nav-link">Sign in</Link>
                    <Link
                      href="/sign-up"
                      className="hidden md:inline-flex"
                      style={{
                        padding: '8px 18px', borderRadius: 12,
                        fontSize: '0.875rem', fontWeight: 700, color: '#fff',
                        textDecoration: 'none',
                        background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                        transition: 'transform 0.2s,box-shadow 0.2s',
                      }}
                    >
                      Try Free
                      <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/>
                      </svg>
                    </Link>
                  </>
                )}
              </>
            )}
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                }
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div 
        className={`md:hidden fixed top-0 right-0 bottom-0 z-50 w-64 bg-white/90 backdrop-blur-2xl border-l border-white/40 shadow-2xl transform transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-5 flex justify-end">
          <button onClick={() => setMenuOpen(false)} className="p-2 text-slate-500 hover:text-slate-800 rounded-lg bg-slate-100/50">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-4">
          <Link href="/#how-it-works" onClick={() => setMenuOpen(false)} className="py-2 text-[0.95rem] font-semibold text-slate-700 border-b border-slate-100">How it works</Link>
          <Link href="/#sample-report" onClick={() => setMenuOpen(false)} className="py-2 text-[0.95rem] font-semibold text-slate-700 border-b border-slate-100">Features</Link>
          <Link href="/pricing" onClick={() => setMenuOpen(false)} className={`py-2 text-[0.95rem] font-semibold border-b border-slate-100 ${isPricing ? 'text-indigo-600' : 'text-slate-700'}`}>Pricing</Link>
          <a href="https://youtu.be/n2CeIIGuadg?si=A4dC_XTWVLWZKq6P" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="py-2 text-[0.95rem] font-semibold text-slate-700 border-b border-slate-100">Watch Demo</a>
          
          {user ? (
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/history" onClick={() => setMenuOpen(false)} className="py-2 text-[0.95rem] font-semibold text-slate-700">History</Link>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="py-2 text-[0.95rem] font-semibold text-indigo-600">Dashboard</Link>
              <button onClick={handleSignOut} className="py-2 text-[0.95rem] font-semibold text-red-500 text-left mt-2">Sign Out</button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/sign-in" onClick={() => setMenuOpen(false)} className="w-full text-center py-2.5 rounded-xl font-bold text-indigo-600 bg-indigo-50 border border-indigo-100">Sign in</Link>
              <Link href="/sign-up" onClick={() => setMenuOpen(false)} className="w-full text-center py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-500/30">Try Free</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
