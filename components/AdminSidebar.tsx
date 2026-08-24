'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar({ open = false, setOpen = () => {} }: { open?: boolean, setOpen?: (val: boolean) => void }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Users', href: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Reports', href: '/admin/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Payments', href: '/admin/payments', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'General Feedback', href: '/admin/general-feedback', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { name: 'Feedback', href: '/admin/feedback', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { name: 'Credit Adjustment', href: '/admin/credit-adjustment', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  ];

  return (
    <div className={`
      fixed sm:static inset-y-0 left-0 top-16 sm:top-0 z-40
      w-[260px] h-[calc(100vh-64px)]
      bg-white/80 sm:bg-white/70 backdrop-blur-xl saturate-150
      border-r border-slate-200/80
      p-[32px_16px] flex flex-col gap-2 overflow-y-auto
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
    `}>
      <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, paddingLeft: 12 }}>
        Admin Dashboard
      </h2>
      
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              textDecoration: 'none',
              fontSize: '0.92rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#4f46e5' : '#64748b',
              background: isActive ? 'rgba(238,242,255,0.8)' : 'transparent',
              border: isActive ? '1px solid rgba(199,210,254,0.6)' : '1px solid transparent',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(241,245,249,0.7)';
                e.currentTarget.style.color = '#334155';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            {isActive && (
              <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 4, height: 20, background: '#4f46e5', borderRadius: '0 4px 4px 0', boxShadow: '0 0 10px rgba(79,70,229,0.5)' }} />
            )}
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? '2.5' : '2'} aria-hidden="true" style={{ opacity: isActive ? 1 : 0.7 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
