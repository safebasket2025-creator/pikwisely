'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      aria-label="Sign out"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 10,
        fontSize: '0.82rem', fontWeight: 600, color: '#4f46e5',
        background: 'rgba(238,242,255,0.70)',
        border: '1.5px solid rgba(165,180,252,0.45)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        fontFamily: 'inherit',
        transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        if (!loading) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(224,231,255,0.90)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(99,102,241,0.15)';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(238,242,255,0.70)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
      }}
    >
      {loading ? (
        <span style={{ width: 13, height: 13, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      ) : (
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
      )}
      {loading ? 'Signing out…' : 'Sign Out'}
    </button>
  );
}
