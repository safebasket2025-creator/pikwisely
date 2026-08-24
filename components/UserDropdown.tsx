'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

interface UserDropdownProps {
  user: User;
  profile: any;
  onSignOut: () => void;
  signingOut: boolean;
}

export default function UserDropdown({ user, profile, onSignOut, signingOut }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name || '';
  const email = user.email || '';
  const initial = fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  const limit = profile?.reports_limit;
  const used = profile?.reports_used || 0;
  
  let planName = 'Free Plan';
  let badgeColors = { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
  
  if (limit && limit > 3) {
    if (limit >= 150) {
      planName = 'Pro Plan';
      badgeColors = { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' };
    } else {
      planName = 'Starter Plan';
      badgeColors = { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' };
    }
  }

  const remaining = limit === -1 ? 9999 : (limit ? limit - used : 0);
  const remainingText = limit === -1 ? 'Unlimited reports remaining' : `${remaining} reports remaining this month`;
  
  // Format renewal date if available
  let renewalText = '';
  if (limit && limit > 3) {
    if (profile?.plan_expiry_date) {
      const d = new Date(profile.plan_expiry_date);
      renewalText = `Plan expires on ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (profile?.subscription_end_date) {
      // Fallback for old subscriptions
      const d = new Date(profile.subscription_end_date);
      renewalText = `Plan expires on ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      renewalText = 'Paid plan';
    }
  } else {
    // Free plan resets based on signup date (created_at)
    const signupDateStr = profile?.created_at || user.created_at;
    const signupDate = signupDateStr ? new Date(signupDateStr) : new Date();
    const resetDay = signupDate.getDate();
    
    // Add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1:  return 'st';
        case 2:  return 'nd';
        case 3:  return 'rd';
        default: return 'th';
      }
    };
    
    renewalText = `Resets on the ${resetDay}${getOrdinalSuffix(resetDay)} of every month`;
  }

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isAdmin = email && adminEmails.includes(email.toLowerCase());

  return (
    <div className="user-dropdown-container" style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1.1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          overflow: 'hidden'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.3)'; }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
      </button>

      {/* Dropdown panel */}
      <div 
        role="menu"
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 12,
          width: 260,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.04)',
          padding: '16px 0',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
          transformOrigin: 'top right',
          transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.2s',
          zIndex: 100,
        }}
      >
        {/* Header section */}
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              background: badgeColors.bg, color: badgeColors.text, border: `1px solid ${badgeColors.border}`,
              fontWeight: 700
            }}>
              {planName}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
              {remainingText}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {renewalText}
            </span>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(226,232,240,0.8)', margin: '4px 0' }} />

        {/* Links section */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 8px' }}>
          <Link 
            href="/history" 
            role="menuitem"
            style={{ 
              padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: '#334155',
              textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(241,245,249,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => setOpen(false)}
          >
            History
          </Link>
          
          {isAdmin && (
            <Link 
              href="/admin" 
              role="menuitem"
              style={{ 
                padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: '#334155',
                textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(241,245,249,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => setOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          
          {(limit === null || limit < 150) && (
            <Link 
              href="/pricing" 
              role="menuitem"
              style={{ 
                padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: '#4f46e5',
                textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(238,242,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => setOpen(false)}
            >
              Upgrade Plan
            </Link>
          )}
        </div>

        <div style={{ height: 1, background: 'rgba(226,232,240,0.8)', margin: '4px 0' }} />

        {/* Sign out section */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 8px' }}>
          <button 
            role="menuitem"
            onClick={() => { setOpen(false); onSignOut(); }}
            disabled={signingOut}
            style={{ 
              padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: '#ef4444',
              background: 'transparent', border: 'none', cursor: signingOut ? 'not-allowed' : 'pointer',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s',
              fontFamily: 'inherit', opacity: signingOut ? 0.6 : 1
            }}
            onMouseEnter={e => { if(!signingOut) e.currentTarget.style.background = 'rgba(254,226,226,0.6)'; }}
            onMouseLeave={e => { if(!signingOut) e.currentTarget.style.background = 'transparent'; }}
          >
            {signingOut ? (
              <span style={{ width: 14, height: 14, border: '2px solid rgba(239,68,68,0.3)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            ) : null}
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
