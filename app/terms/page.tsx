import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Pikwisely.',
};

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '120px 24px 80px', minHeight: '100vh' }}>
        <div className="glass-strong" style={{ padding: '40px 48px', borderRadius: 24 }}>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 32 }}>Last updated: {lastUpdated}</p>
          
          <div style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Acceptance of Terms</strong>
              By using Pikwisely, you agree to these terms.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Service Description</strong>
              Pikwisely provides AI-generated analysis of product reviews to assist e-commerce sellers in sourcing decisions. This is a decision-support tool, not financial or business advice — users make their own independent decisions.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Account Responsibilities</strong>
              You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Acceptable Use</strong>
              Users must not misuse the service, attempt to bypass credit limits, submit illegal or harmful content, or attempt to reverse-engineer the service.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Credits &amp; Plans</strong>
              Free plan includes 3 reports/month, resetting monthly from your signup date. Paid plans (Starter/Pro) provide a one-time credit allocation valid for 30 days from purchase; credits do not roll over and plans do not auto-renew — renewal requires a new purchase.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Payment Terms</strong>
              All payments are processed securely via Razorpay. Prices are listed in INR and are subject to change with notice.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Refunds</strong>
              Refer to our <a href="/refund-policy" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>Refund Policy</a> for details.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Limitation of Liability</strong>
              Pikwisely provides analysis based on user-submitted data and does not guarantee business outcomes. We are not liable for decisions made based on our reports.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Termination</strong>
              We reserve the right to suspend accounts that violate these terms.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Changes to Terms</strong>
              We may update these terms; continued use constitutes acceptance of changes.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Contact</strong>
              <a href="mailto:supportpikwisely@gmail.com" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>supportpikwisely@gmail.com</a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
