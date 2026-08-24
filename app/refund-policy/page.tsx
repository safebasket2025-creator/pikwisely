import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund policy for Pikwisely subscriptions.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '120px 24px 80px', minHeight: '100vh' }}>
        <div className="glass-strong" style={{ padding: '40px 48px', borderRadius: 24 }}>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 24 }}>Refund Policy</h1>
          
          <div style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{ margin: 0 }}>We want you to feel confident trying Pikwisely. Here&apos;s how refunds work:</p>
            
            <div style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Eligibility window:</strong> Refund requests must be made within 7 days of your purchase date.
            </div>

            <div style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Usage limit:</strong>
              <ul style={{ paddingLeft: 24, marginTop: 8, marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>Starter plan:</strong> eligible if you&apos;ve used 5 or fewer reports from your current billing cycle</li>
                <li><strong>Pro plan:</strong> eligible if you&apos;ve used 10 or fewer reports from your current billing cycle</li>
              </ul>
            </div>

            <p style={{ margin: 0 }}>This ensures refunds are for genuine cases where the tool wasn&apos;t right for you — not after substantial use.</p>

            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>How to request:</strong> Email <a href="mailto:support@pikwisely.site" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>support@pikwisely.site</a> with your registered account email and order details. We&apos;ll process approved refunds within 5-7 business days to your original payment method.
            </p>

            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Free plan:</strong> Since the Free plan has no cost, it is not eligible for refunds.
            </p>

            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Subscription cancellations:</strong> You can cancel your subscription anytime to stop future billing. Cancellation is separate from a refund and does not automatically refund the current billing cycle unless the above conditions are met.
            </p>

            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Questions?</strong> Reach out to us at <a href="mailto:support@pikwisely.site" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>support@pikwisely.site</a> — we&apos;re happy to help.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
