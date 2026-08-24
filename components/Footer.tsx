import Link from 'next/link';

const footerLinks = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: 'mailto:support@pikwisely.site', label: 'Contact' },
  { href: '/refund-policy', label: 'Refund Policy' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms' },
];

export default function Footer() {
  return (
    <footer id="site-footer" style={{ position: 'relative', zIndex: 10 }}>
      <style>{`
        .footer-link {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          display: inline-block;
          transition: color 0.2s, background 0.2s;
        }
        .footer-link:hover {
          color: #4f46e5;
          background: rgba(238,242,255,0.70);
        }
      `}</style>

      {/* Glass divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(165,180,252,0.35) 20%,rgba(165,180,252,0.50) 50%,rgba(165,180,252,0.35) 80%,transparent)', margin: '0 24px' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 40px' }}>
        <div id="footer-main-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 28 }}>

          {/* Logo */}
          <Link href="/" aria-label="Pikwisely home" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo.png" alt="Pikwisely Logo" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'contain' }} />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg,#4338ca 0%,#6366f1 55%,#818cf8 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pikwisely
            </span>
          </Link>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
              {footerLinks.map((item, i) => (
                <li key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
                  <Link href={item.href} className="footer-link">{item.label}</Link>
                  {i < footerLinks.length - 1 && (
                    <span style={{ width: 1, height: 14, background: 'rgba(203,213,225,0.60)', margin: '0 2px', display: 'inline-block' }} aria-hidden="true" />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div style={{ height: 1, background: 'rgba(226,232,240,0.55)', marginBottom: 20 }} />

        <div id="footer-bottom-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 400, lineHeight: 1.6, maxWidth: 580, margin: 0 }}>
            Pikwisely provides analysis based on available review data and is intended as a decision-support tool, not financial advice.
          </p>
          <p style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 500, margin: 0, whiteSpace: 'nowrap' }}>
            © 2026 Pikwisely. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
