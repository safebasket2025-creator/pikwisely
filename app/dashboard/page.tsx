import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import AppNavbar from '@/components/AppNavbar';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your Pikwisely analysis dashboard.',
};

export default async function DashboardPage() {
  const user = await currentUser();

  // Middleware protects this route, but double-check server-side
  if (!user) {
    redirect('/sign-in');
  }

  const displayName =
    user.firstName ||
    user.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'there';

  return (
    <>
      {/* Floating blobs */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="blob-a" style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'rgba(165,180,252,0.28)', filter: 'blur(70px)', top: -100, left: -80 }} />
        <div className="blob-b" style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: 'rgba(196,181,253,0.22)', filter: 'blur(60px)', top: '8%', right: -50, animationDelay: '1s' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>

        {/* Navbar */}
        <AppNavbar />

        {/* Main content */}
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 60px' }}>

          <div className="animate-fade-up" style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
              Hey, {displayName}! 👋
            </h1>
            <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: 400, lineHeight: 1.7 }}>
              Welcome to your dashboard. Start by analyzing a product.
            </p>
          </div>

          {/* Quick-start CTA */}
          <div className="glass-strong animate-fade-up-2" style={{ borderRadius: 20, padding: '32px 28px', marginBottom: 24 }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[14px] mb-[20px]">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(238,242,255,0.90), rgba(237,233,254,0.75))', border: '1.5px solid rgba(165,180,252,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="url(#dashGrad)" strokeWidth="1.8" aria-hidden="true">
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#4338ca"/>
                      <stop offset="100%" stopColor="#818cf8"/>
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>Start a new analysis</h2>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 400 }}>Paste a product URL or raw reviews to get your report</p>
              </div>
            </div>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12,
                fontSize: '0.9rem', fontWeight: 700, color: '#fff', textDecoration: 'none',
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              }}
            >
              Analyze a Product
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </Link>
          </div>

          {/* Usage stats */}
          <div className="animate-fade-up-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { label: 'Reports Used', value: '0', sub: 'of 3 this month', accent: '#6366f1' },
              { label: 'Reports Left', value: '3', sub: 'Free plan', accent: '#10b981' },
              { label: 'Current Plan', value: 'Free', sub: 'Upgrade for more', accent: '#f59e0b' },
            ].map(stat => (
              <div key={stat.label} className="glass" style={{ borderRadius: 16, padding: '20px 18px', textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, color: '#0f172a', marginBottom: 4, lineHeight: 1 }}>
                  {stat.value}<span style={{ color: stat.accent }}>.</span>
                </p>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 2 }}>{stat.label}</p>
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>
                  {stat.label === 'Current Plan' ? (
                    <Link href="/pricing" style={{ color: stat.accent, textDecoration: 'none', fontWeight: 600 }}>{stat.sub}</Link>
                  ) : (
                    stat.sub
                  )}
                </p>
              </div>
            ))}
          </div>

        </main>
      </div>
    </>
  );
}
